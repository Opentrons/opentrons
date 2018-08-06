#!/usr/bin/env node
'use strict'

// TODO(mc, 2018-07-25): actually compile this package; until then,
// NODE_ENV must be set to "test" for this register to work with "import"
require('babel-register')

const {default: DiscoveryClient, DEFAULT_POLL_INTERVAL} = require('..')

const LOG_LVL = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']
  .indexOf(process.env.OT_LOG_LEVEL || 'info')

const noop = () => {}

const argv = require('yargs-parser')(process.argv.slice(2), {
  number: ['pollInterval'],
  string: ['nameFilter'],
  array: ['services', 'candidates', 'allowedPorts'],
  default: {
    pollInterval: DEFAULT_POLL_INTERVAL,
    services: [],
    candidates: [],
    allowedPorts: [],
    nameFilter: ''
  },
  alias: {
    p: 'pollInterval',
    s: 'services',
    c: 'candidates',
    n: 'nameFilter',
    a: 'allowedPorts'
  },
  coerce: {
    services: objectNotationToArray,
    candidates: objectNotationToArray
  }
})

const logger = {
  error: LOG_LVL >= 0 ? console.error : noop,
  warn: LOG_LVL >= 1 ? console.warn : noop,
  info: LOG_LVL >= 2 ? console.info : noop,
  http: LOG_LVL >= 3 ? console.debug : noop,
  verbose: LOG_LVL >= 4 ? console.debug : noop,
  debug: LOG_LVL >= 5 ? console.debug : noop,
  silly: LOG_LVL >= 6 ? console.debug : noop
}

const client = DiscoveryClient(Object.assign({}, argv, {logger}))

client
  .on('service', s => console.info('service added or updated:', s))
  .on('serviceRemoved', s => console.info('service removed:', s))
  .on('error', console.error)
  .start()

console.info('searching for services')

function objectNotationToArray (obj) {
  if (Array.isArray(obj)) return obj
  return Array.from(Object.assign({}, obj, {length: Object.keys(obj).length}))
}
