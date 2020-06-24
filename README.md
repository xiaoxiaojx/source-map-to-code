### source-map-to-code

> Get the source code information from the compiled file and error information location through source map

#### install

```
yarn add source-map-to-code
```

#### example

```
const { printSourceCodeInfo, getSourceCodeInfo } = require('source-map-to-code')

printSourceCodeInfo({
    filePath: './build/static/js/main.4e7cf41f.js',
    position: {
        line: 3,
        column: 0
    }
})

// print

Source code file path:
  ./es6/test.js

Source code snippets:
  2  var isTest = true
  3  const version = window.version   <------ Error(3:0)
  4  console.log(version)

```
