#!/usr/bin/env node

require('@babel/register')({
  plugins: ['@babel/plugin-transform-modules-commonjs'],
})

// NOTE: the following was adapted from nanobench/run.js
// eslint-disable-next-line no-unused-vars
const bench = require('nanobench')
const path = require('path')

global.__NANOBENCH__ = require.resolve('nanobench')

for (let i = 2; i < process.argv.length; i++) {
  require(path.join(process.cwd(), process.argv[i]))
}
