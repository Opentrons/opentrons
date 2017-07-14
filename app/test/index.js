// require all test files (files that end with .spec.js)
var testsContext = require.context('./specs', true, /\.spec$/)
testsContext.keys().forEach(testsContext)
