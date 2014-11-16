var css = require('css');


var VENDOR_PREFIXES = 'o|moz|webkit|ms|atsc|wap|khtml|apple|xv';
var VENDOR_PREFIX = new RegExp('^\\-(' + VENDOR_PREFIXES + ')\\-([a-z\-]+)$');
var VENDOR_PREFIX_G = new RegExp('\\-(' + VENDOR_PREFIXES + ')\\-([a-z\-]+)', 'g');
VENDOR_PREFIXES = VENDOR_PREFIXES.split('|');


/**
 * Returns the devendorized version of the string
 *
 * @method devendorize
 * @param {String} string
 * @returns {String}
 */
function devendorize(string) {
  return string.replace(VENDOR_PREFIX_G, '$2');
}


var CLEANUP_MAP = {
  'to left':     'right',
  'to right':    'left',
  'to top':      'bottom',
  'to bottom':   'top',
  'from left':   'left',
  'from right':  'right',
  'from top':    'top',
  'from bottom': 'bottom'
};
var CLEANUP_REGEXP = new RegExp('(?:' + Object.keys(CLEANUP_MAP).join('|') + ')', 'g');
var CLEANUP_CACHE = Object.create(null);
var CHAR_CODES = {
  a:   'a'.charCodeAt(0),
  z:   'z'.charCodeAt(0),
  '0': '0'.charCodeAt(0),
  '9': '9'.charCodeAt(0)
};
function isIdentifierChar(char) {
  var charCode = char.charCodeAt(0);
  return char === '_' || (charCode >= CHAR_CODES.a && charCode <= CHAR_CODES.z) ||
    (charCode >= CHAR_CODES['0'] && charCode <= CHAR_CODES['9']);
}
/**
 * Cleanup a CSS value to compare it
 *
 * @method cleanupCssValueForComparison
 * @param {String} value
 * @returns {string}
 */
function cleanupCssValueForComparison(value) {
  var res = CLEANUP_CACHE[value];
  if (res === undefined) {
    CLEANUP_CACHE[value] = res = value
      .replace(/(?:^\s+|\s+$)/g, '')
      .replace(/\s+/g, ' ')
      .replace(VENDOR_PREFIX_G, '$2')
      .replace(/(^|[.\n]) ([.\n]|$)/g, function (dummy, before, after) {
        if (isIdentifierChar(before) && isIdentifierChar(after)) {
          return dummy;
        }
        else {
          return before + after;
        }
      })
      .toLowerCase()
      .replace(CLEANUP_REGEXP, function (dummy, key) {
        return CLEANUP_MAP[key] || '';
      });
  }
  return res;
}

/**
 * Compare 2 CSS values
 *
 * @method compareCssValues
 * @param {String} value1
 * @param {String} value2
 * @returns {Number}
 */
function compareCssValues(value1, value2) {
  value1 = cleanupCssValueForComparison(value1);
  value2 = cleanupCssValueForComparison(value2);
  return value1 === value2 ? 0 : 1;
}

/**
 * Extract prefixed properties or names
 *
 * @method extractPrefixed
 * @param {String} string
 * @returns {Array|{names: Array, fullNames: Array}}
 */
function extractPrefixed(string) {
  var matches, res, obj, match;
  if ((matches = string.match(VENDOR_PREFIX_G))) {
    res = [];
    res.fullNames = [];
    res.names = [];
    for (var i = 0; i < matches.length; i++) {
      match = matches[i].match(VENDOR_PREFIX);
      obj = Object.create(null);
      obj.name = match[2];
      obj.vendor = '-' + match[1] + '-';
      obj.fullName = matches[i];
      res.names.push(obj.name);
      res.fulNames.push(obj.fullName);
      res.push(obj);
    }
    return res;
  }
}

var uuid = 0;
/**
 * Get the meta of an object
 *
 * @method metaFor
 * @param {*} object
 * @returns {Object}
 */
function metaFor(object) {
  var meta;
  if (!(meta = object.__cssdvMeta__)) {
    Object.defineProperty(object, '__cssdvMeta__', {value: meta = Object.create(null)});
    meta.uuid = '' + (++uuid);
  }
  return meta;
}
/**
 * Get the UUID of an object
 *
 * @method uuidFor
 * @param {*} object
 * @returns {String}
 */
function uuidFor(object) {
  return metaFor(object).uuid;
}
/**
 * Finds a non deleted declaration in an array by property name
 *
 * @method findDeclBy
 * @param {Array.<Object>} container
 * @param {String} property
 * @returns {Object}
 */
function findDeclBy(container, property) {
  for (var i = 0; i < container.length; i++) {
    if (container[i].type === 'declaration' && !metaFor(container[i]).deleted && container[i].property === property) {
      return container[i];
    }
  }
}
/**
 * Get the base (without prefix) keyframe for the given name in a container
 *
 * @method baseKeyframesForName
 * @param {Array.<Object>} container
 * @param {String} name
 * @returns {Object}
 */
function baseKeyframesForName(container, name) {
  var node, meta = metaFor(container);
  if (!meta.baseKeyframes) {
    meta.baseKeyframes = Object.create(null);
  }
  else if (meta.baseKeyframes[name]) {
    return meta.baseKeyframes[name];
  }
  for (var i = 0; i < container.length; i++) {
    node = container[i];
    if (node.type === 'keyframes' && !node.vendor && node.name === name) {
      meta.baseKeyframes[name] = node;
      return node;
    }
  }
}
/**
 * Cleanup the keyframes values
 *
 * @method cleanKeyframeValues
 * @param {Array.<String>} values
 * @param {Boolean} asArray
 * @returns {Array|Object}
 */
function cleanKeyframeValues(values, asArray) {
  var i, cleaned = Object.create(null), one;
  for (i = 0; i < values.length; i++) {
    one = '' + values[i];
    if (one === 'from') {
      one = '0%';
    }
    else if (one === 'to') {
      one = '100%';
    }
    cleaned[one] = 0;
  }
  return asArray ? Object.keys(cleaned) : cleaned;
}

/**
 * Finds a keyframe in the given container that would be matched for the given keyframe
 *
 * @method findMatchingKeyframe
 * @param {Array.<Object>} keyframes
 * @param {Object} keyframe
 * @returns {Object}
 */
function findMatchingKeyframe(keyframes, keyframe) {
  var i, j, toMatch = cleanKeyframeValues(keyframe.values, true), got;
  for (i = 0; i < keyframes, keyframes.length; i++) {
    got = cleanKeyframeValues(keyframes[i].values);
    match = true;
    for (j = 0; j < toMatch.length; j++) {
      if (!(toMatch[j] in got)) {
        match = false;
        break;
      }
    }
    if (match) {
      return keyframes[i];
    }
  }
}

/**
 * @class Cleaner
 * @constructor
 * @param {Object} options
 */
function Cleaner(options) {
}

/**
 * Process the given `declaration` node
 *
 * @method _processDeclarationNode
 * @param {Object} node
 * @param {Number} level
 * @param {Array.<Object>} container
 * @private
 */
Cleaner.prototype._processDeclarationNode = function (node, level, container) {
  var baseName = devendorize(node.property);
  if (baseName !== node.property) {
    // it's a vendor
    if (findDeclBy(container, baseName)) {
      // we already have the not prefixed version of the property, flag as removal
      this._flagForRemoval(node, container);
    }
    else {
      // transform the node into the not prefixed version
      node.property = baseName;
    }
  }
};

/**
 * Process the given `keyframes` node
 *
 * @method _processKeyframesNode
 * @param {Object} node
 * @param {Number} level
 * @param {Array.<Object>} container
 * @private
 */
Cleaner.prototype._processKeyframesNode = function (node, level, container) {
  var i, j, baseKeyframes, srcKeyframe, dstKeyframe, baseName, declaration;
  if (node.vendor) {
    baseKeyframes = baseKeyframesForName(container, node.name);
    // if we have no base keyframes, let's this node become it, else flag it for removal
    if (baseKeyframes) {
      this._flagForRemoval(node, container);
      // we need to merge all keyframes into the base one
      for (i = 0; i < node.keyframes.length; i++) {
        srcKeyframe = node.keyframes[i];
        dstKeyframe = findMatchingKeyframe(baseKeyframes.keyframes, srcKeyframe);
        // no we merge into the matching destination keyframe found
        if (dstKeyframe) {
          for (j = 0; j < srcKeyframe.declarations.length; j++) {
            declaration = srcKeyframe.declarations[j];
            //TODO: handle the append flag
            if (this._mergeDeclarationInSet(declaration, dstKeyframe.declarations)) {
              // the declaration has been moved
              declaration.parent = dstKeyframe;
            }
            else {
              this._flagForRemoval(declaration, srcKeyframe.declarations);
            }
          }
        }
        else {
          // move the keyframe, there is no one matching yet
          srcKeyframe.parent = baseKeyframes;
          baseKeyframes.keyframes.push(srcKeyframe);
          this._processKeyframeNode(srcKeyframe, level + 1, baseKeyframes.keyframes);
        }
      }
    }
    else {
      // we don't have matching base keyframe, let's make this node become it
      node.vendor = undefined;
      this._processNodes(node.keyframes, level + 1);
    }
  }
  else {
    // we are a base keyframes
    this._processNodes(node.keyframes, level + 1);
  }
};

/**
 * Process the given `rule` node
 *
 * @method _processRuleNode
 * @param {Object} node
 * @param {Number} level
 * @param {Array.<Object>} container
 * @private
 */
Cleaner.prototype._processRuleNode = function (node, level, container) {
  //TODO: process selectors too
  this._flattenDeclarationValues(node.declarations);
  this._processNodes(node.declarations, level + 1);
};

/**
 * Process the given `keyframe` node
 *
 * @method _processKeyframeNode
 * @param {Object} node
 * @param {Number} level
 * @param {Array.<Object>} container
 * @private
 */
Cleaner.prototype._processKeyframeNode = Cleaner.prototype._processRuleNode;

/**
 * Process the given `stylesheet` node
 *
 * @method _processStylesheetNode
 * @param {Object} node
 * @param {Number} level
 * @param {Array.<Object>} container
 * @private
 */
Cleaner.prototype._processStylesheetNode = function (node, level, container) {
  this._processNodes(node.stylesheet.rules, level + 1);
};

/**
 * Process the given `media` node
 *
 * @method _processMediaNode
 * @param {Object} node
 * @param {Number} level
 * @param {Array.<Object>} container
 * @private
 */
Cleaner.prototype._processMediaNode = function (node, level, container) {
  this._processNodes(node.rules, level + 1);
};

/**
 * Process the given array of nodes
 *
 * @method _processNodes
 * @param {Array.<Object>} nodes
 * @param {Number} level
 * @private
 */
Cleaner.prototype._processNodes = function (nodes, level) {
  for (var i = 0; i < nodes.length; i++) {
    this._processNode(nodes[i], level, nodes);
  }
};

/**
 * Process the given node
 *
 * @method _processNode
 * @param {Object} node
 * @param {Number} level
 * @param {Array.<Object>} container
 * @private
 */
Cleaner.prototype._processNode = function (node, level, container) {
  var method;
  if (!metaFor(node).deleted) {
    method = '_process' + node.type.substr(0, 1).toUpperCase() + node.type.substr(1) + 'Node';
    if (typeof this[method] === 'function') {
      this[method](node, level, container);
    }
  }
};

/**
 * Flatten the values of the declarations array given
 *
 * @method _flattenDeclarationValues
 * @param {Array.<Object>} container
 * @private
 */
Cleaner.prototype._flattenDeclarationValues = function (container) {
  var i, newValue, value, node, meta = metaFor(container);
  if (!meta.flattened) {
    meta.flattened = true;
    i = container.length;
    while (i > 0) {
      i--;
      node = container[i];
      if (node.type !== 'declaration' || metaFor(node).deleted) {
        continue;
      }
      value = node.value;
      newValue = devendorize(value);
      if (newValue !== value) {
        if (this._findMatchingDeclaration(node, container, true, null, newValue)) {
          this._flagForRemoval(node, container);
        }
        else {
          node.value = newValue;
        }
      }
    }
  }
};

/**
 * Merges a given declaration in the given declaration array and returns `true` if that node has been moved to
 * the destination set
 *
 * @method _mergeDeclarationInSet
 * @param {Object} declaration
 * @param {Array.<Object>} destinationSet
 * @param {Boolean} append
 * @returns {Boolean}
 * @private
 */
Cleaner.prototype._mergeDeclarationInSet = function (declaration, destinationSet, append) {
  var self = this;
  var name = declaration.property;
  var baseName = devendorize(name);
  var isVendor = name !== baseName;
  var existingBase, existing;

  function find() {
    if (existing === undefined) {
      existing = self._findMatchingDeclaration(declaration, destinationSet) || null;
    }
    return existing;
  }

  function findBase() {
    if (existingBase === undefined) {
      existingBase = self._findMatchingDeclaration(declaration, destinationSet, false, baseName) || null;
    }
    return existingBase;
  }

  this._flattenDeclarationValues(destinationSet);

  if (append) {
    if (find() && existing.value === declaration.value) {
      return false;
    }
    else if (findBase() && existingBase.value === declaration.value) {
      return false;
    }
    else {
      declaration.property = baseName;
      destinationSet.push(declaration);
      return true;
    }
  }
  else {
    // only merge if it does not exists
    if (!findBase()) {
      declaration.property = baseName;
      destinationSet.push(declaration);
      return true;
    }
    return false;
  }
};

/**
 * Finds a matching declaration in another set of declarations
 *
 * @method _findMatchingDeclaration
 * @param {Object} node
 * @param {Array.<Object>} container
 * @param {Boolean} [sameValue=false]
 * @param {String} [nameToMatch=node.property]
 * @param {String} [valueToMatch=node.value]
 * @returns {Object}
 * @private
 */
Cleaner.prototype._findMatchingDeclaration = function (node, container, sameValue, nameToMatch, valueToMatch) {
  if (nameToMatch == null) {
    nameToMatch = node.property;
  }
  if (!valueToMatch == null) {
    valueToMatch = node.value
  }
  var matchingNode = findDeclBy(container, nameToMatch);
  if (matchingNode && (!sameValue || compareCssValues(valueToMatch, matchingNode.value) === 0)) {
    return matchingNode;
  }
};

/**
 * Flags a node to be removed from given container
 *
 * @method _flagForRemoval
 * @param {Object} node
 * @param {Array.<Object>} container
 * @private
 */
Cleaner.prototype._flagForRemoval = function (node, container) {
  var containerUuid, nodeUuid, source;
  containerUuid = uuidFor(container);
  nodeUuid = uuidFor(node);
  metaFor(node).deleted = true;
  if ((source = this._flaggedForRemoval[containerUuid])) {
    if (source.indexOf(nodeUuid) < 0) {
      // not already flagged for removal
      source.push(nodeUuid);
    }
  }
  else {
    this._flaggedForRemoval[containerUuid] = source = [nodeUuid];
    Object.defineProperty(source, 'container', {value: container});
  }
};

/**
 * Removes all nodes flagged for removal from their container
 *
 * @method _removeFlagged
 * @private
 */
Cleaner.prototype._removeFlagged = function () {
  var container, i, containerUuid, nodeUuids, idx;
  if (this._flaggedForRemoval) {
    for (containerUuid in this._flaggedForRemoval) {
      nodeUuids = this._flaggedForRemoval[containerUuid];
      container = nodeUuids.container;
      i = container.length;
      while (i > 0) {
        i--;
        if ((idx = nodeUuids.indexOf(uuidFor(container[i]))) >= 0) {
          nodeUuids.splice(idx, 1);
          container.splice(i, 1);
        }
      }
    }
  }
  this._flaggedForRemoval = null;
};

/**
 * Reset to be able to process a new CSS input
 */
Cleaner.prototype.reset = function () {
  this._ast = null;
  this._flaggedForRemoval = Object.create(null);
};

/**
 * Clean the given input and return the new CSS
 *
 * @method clean
 * @param {String} source
 * @param {Object} [options]
 * @returns {String}
 */
Cleaner.prototype.clean = function (source, options) {
  return this.cleanAst(css.parse(source)).toString();
};

/**
 * Cleans a given CSS AST
 *
 * @method cleanAst
 * @param {Object} ast
 * @param {Object} [options]
 * @chainable
 */
Cleaner.prototype.cleanAst = function (ast, options) {
  this.reset();
  this._ast = ast;
  this._processNode(this._ast, 0);
  this._removeFlagged();
  return this;
};

/**
 * Returns the CSS version of this cleaner
 *
 * @method toString
 * @returns {String}
 */
Cleaner.prototype.toString = function () {
  return css.stringify(this._ast);
};

module.exports = Cleaner;
