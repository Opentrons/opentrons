#!/usr/bin/env node

// NOTE: adapted from nanobench/run.js
require('@babel/register')

if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    'To run benchmarks, NODE_ENV must be "test" (for CommonJS transforms etc)'
  )
}
// eslint-disable-next-line no-unused-vars
const bench = require('nanobench')
const path = require('path')

global.__NANOBENCH__ = require.resolve('nanobench')

for (let i = 2; i < process.argv.length; i++) {
  require(path.join(process.cwd(), process.argv[i]))
}
