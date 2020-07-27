// script to run benchmark tests given a glob path
'use strict'

const assert = require('assert')
require('@babel/register')({
  plugins: ['@babel/plugin-transform-modules-commonjs'],
})

const globby = require('globby')
// eslint-disable-next-line no-unused-vars
const bench = require('nanobench')
const path = require('path')

const USAGE =
  "\nUsage:\n  node ./scripts/runBenchmarks 'path/to/benchmarks/*.js'"
assert(process.argv.length === 3, USAGE)

const benchmarkFiles = globby.sync(process.argv[2])

// NOTE: adapted from nanobench/run.js
global.__NANOBENCH__ = require.resolve('nanobench')

benchmarkFiles.forEach(f => {
  require(path.join(process.cwd(), f))
})
