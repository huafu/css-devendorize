var expect = require('chai').expect;
var FIXTURES = require('./fixtures/index');

var lib = require('../index');


describe('css-devendorize', function () {
  it('should remove all vendor prefixes', function () {
    var cleaner = new lib.Cleaner();
    expect(cleaner.lintCss(FIXTURES.sources.app)).to.equal(FIXTURES.expecteds.app);
  });
});
