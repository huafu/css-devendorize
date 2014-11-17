# CSS devendorize - CSS vendor prefixes remover

This can sounds weird to **remove** CSS vendor prefixes from a CSS, but what in the case you want to use [prefix-free](http://leaverou.github.io/prefixfree/) for example without changing your vendors' CSS files one by one, you can use this tool to remove the vendors from any source.

While this is still in alpha, it's working and usable.

## Installation

* `npm install --save css-devendorize`

## Usage

### CLI tool

* To use the CLI tool, you can use either `css-devendorize` or `css-unprefix`:
    ```shell
      Usage: css-unprefix [options] [files]

      Options:

        -h, --help               output usage information
        -V, --version            output the version number
        -o, --output <path>      path where the output file(s) will be generated (file or path)
        -b, --base-path <path>   base path when `output` is a directory, default to current directory
        -m, --source-map [path]  generates source-map, relative to current directory or given path
        -r, --recursive          include sub directories
    ```

    - `-o` or `--output`:
        - if it's a directory, file(s) will be generated in that directory, with the same directory hierarchy as the input file relative to the **base path**
        - if it's a file, all the input files will be concatenated in that file
    - `-b` or `--base`:
        - by default it is the current working directory; it's used to find out the relative path to an output file in the output directory, using its input file's path relative to base path
    - `-m` or `--source-map`:
        - used to generate source-amp file(s); if no path given, the input file path will appear relative to the current working directory in the source-map file, else it'll be relative to the given path in this argument value
    - `-r` or `--recursive`:
        - if present, it'll look for CSS files in all sub directories fo the given path(s)

* examples (expect running those from the base path of this project):
    - `css-unprefix -r -m -o output test`:
        - will look recursively for CSS input files in the `test` directory, and generate output files in the `output` directory, as well as source-map files
        - `output/test/fixtures/app.css`, `output/test/fixtures/app.css.map`, `output/test/fixtures/app.expected.css` and `output/test/fixtures/app.expected.css.map` will be generated
    - `css-unprefix -r -o output -b test/fixtures test`:
        - will look recursively for CSS input files in the `test` directory, and generate output files in the `output` directory using the file relative paths to `test/fixture` as output path
        - `output/app.css` and `output/app.expected.css` will be generated


### Library API

* To remove CSS from an input string getting directly the resulting CSS, use:
    ```js
    var Cleaner = require('css-devendorize').Cleaner;
    var cleaner = new Cleaner();
    console.log(cleaner.lintCss(cssString));
    ```

* To remove CSS from an AST, with options to keep sourceMaps or such:
    ```js
    var Cleaner = require('css-devendorize').Cleaner;
    var cleaner = new Cleaner();
    console.log(cleaner.lintAst(cssAST/*, options */));
    ```

* There is also a browserified version, which you can use in your browser directly, in the `dist` folder.

## Authors

* [Huafu Gandon](https://github.com/huafu)
