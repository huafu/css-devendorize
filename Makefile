BIN=./node_modules/.bin
UGLIFYJS_OPTIONS=-m
PACKAGE_NAME="css-devendorize"
JSCSSP="./node_modules/jscssp/src"

build: clean
	@$(BIN)/browserify index.js > dist/$(PACKAGE_NAME).js && \
		$(BIN)/uglifyjs dist/$(PACKAGE_NAME).js -o dist/$(PACKAGE_NAME).min.js $(UGLIFYJS_OPTIONS) && \
		$(BIN)/browserify ./index.js test/*.js > dist/$(PACKAGE_NAME)-test.js && \
		$(BIN)/uglifyjs dist/$(PACKAGE_NAME)-test.js -o dist/$(PACKAGE_NAME)-test.min.js $(UGLIFYJS_OPTIONS)

clean:
	@rm -rf dist/*

generate-fixtures:
	@node -e '\
		var fs = require("fs"); \
		function w(f, s) { fs.writeFileSync("test/fixtures/" + f, s, {encoding: "utf8"}); } \
		function r(f) { \
			if (!fs.existsSync("test/fixtures/" + f)) { return null; } \
			return fs.readFileSync("test/fixtures/" + f, {encoding: "utf8"}); \
		} \
		w("index.js", "module.exports = " + JSON.stringify({\
			sources: { app: r("app.css") }, \
			expecteds: { app: r("app.expected.css") } \
		}, null, "  ") + ";");'

generate-expected-fixtures:
	@node -e '\
		var fs = require("fs"); \
		var C = require("./index").Cleaner; \
		var c = new C(); \
		function w(f, s) { fs.writeFileSync("test/fixtures/" + f, s, {encoding: "utf8"}); } \
		function r(f) { return fs.readFileSync("test/fixtures/" + f, {encoding: "utf8"}); } \
		w("app.expected.css", c.clean(r("app.css")));'

test-node:
	@$(BIN)/mocha

test-browser:
	@$(BIN)/testem ci

test: build test-node test-browser
