# CSS devendorize - CSS vendor prefixes remover

This can sounds weird to **remove** CSS vendor prefixes from a CSS, but that in the case you want to use [prefix-free](http://leaverou.github.io/prefixfree/) for example without changing your vendors' CSS files one by one, you can use this tool to remove the vendors from any source.

While this is still a prototype, it's working and usable. More features and options to come later.

## Installation

* `npm install --save css-devendorize`

## Usage

* To remove CSS from an input string getting directly the resulting CSS, use:

```js
var Cleaner = require('css-devendorize').Cleaner;
var cleaner = new Cleaner();
console.log(cleaner.clean(cssString));
```

* To remove CSS from an AST, with options to keep sourceMaps or such:

```js
var Cleaner = require('css-devendorize').Cleaner;
var cleaner = new Cleaner();
console.log(cleaner.cleanAst(cssAST/*, options */));
```

* There is also a browserified version, which you can use in your browser directly, in the `dist` folder.

## Authors

* [Huafu Gandon](https://github.com/huafu)
