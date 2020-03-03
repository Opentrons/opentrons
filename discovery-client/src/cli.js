// @flow
import { createDiscoveryClient } from '.'
import { version } from '../package.json'

const LOG_LVLS = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']
const noop = (...args: Array<*>) => {}

const NORMALIZE_IP_RE = /\[?([a-f0-9.:]+)]?/i

require('yargs')
  .options({
    pollInterval: {
      describe: 'How often the health poller hits every IP address',
      alias: 'p',
      default: 1000,
      type: 'number',
    },
    nameFilter: {
      describe: 'Filter found robots by name',
      alias: 'n',
      default: [],
      type: 'array',
    },
    ipFilter: {
      describe: 'Filter found robots by IP address',
      alias: 'i',
      default: [],
      type: 'array',
    },
    portFilter: {
      describe: 'Filter mDNS advertisements by port',
      alias: 'a',
      default: [],
      type: 'array',
    },
    candidates: {
      describe: 'Extra IP addresses to poll outside of mDNS',
      alias: 'c',
      default: [],
      type: 'array',
    },
    logLevel: {
      describe: 'Log level',
      alias: 'l',
      choices: [...LOG_LVLS, 'off'],
      default: 'info',
    },
  })
  .env('OT_DC')
  .middleware([addLogger, addHandleError, logArgv])
  .command(['$0', 'browse'], 'Browse for robots on the network', noop, browse)
  .command(
    'find [name]',
    'Find the IP of a robot by its name',
    yargs => {
      yargs.positional('name', {
        describe: 'Name of robot to find; if omitted will find first robot',
        type: 'string',
      })
      yargs.option('timeout', {
        describe: 'How long to wait for a robot',
        alias: 't',
        default: 5000,
        type: 'number',
      })
    },
    find
  )
  .version(version)
  .help()
  .parse()

function browse(argv) {
  createDiscoveryClient(argv)
    .on('service', s => argv.logger.info('services added or updated:', s))
    .on('serviceRemoved', s => argv.logger.info('services removed:', s))
    .once('error', argv.handleError)
    .start()

  argv.logger.warn('Browsing for services')
}

function find(argv) {
  setTimeout(
    () => argv.handleError('Timed out waiting for robot'),
    argv.timeout
  )

  createDiscoveryClient(argv)
    .on('service', updatedServices => {
      updatedServices
        .filter(s => !argv.name || s.name === argv.name)
        .forEach(s => {
          process.stdout.write(`${normalizeIp(s.ip)}\n`)
          process.exit(0)
        })
    })
    .once('error', argv.handleError)
    .start()

  argv.logger.warn(`Finding robot with name: "${argv.name || ''}"`)
}

// remove brackets from IPv6
function normalizeIp(ip: string): string {
  const match = ip.match(NORMALIZE_IP_RE)
  return (match && match[1]) || ''
}

function addLogger(argv) {
  const level = LOG_LVLS.indexOf(argv.logLevel)

  argv.logger = {
    error: level >= 0 ? console.error : noop,
    warn: level >= 1 ? console.warn : noop,
    info: level >= 2 ? console.info : noop,
    http: level >= 3 ? console.debug : noop,
    verbose: level >= 4 ? console.debug : noop,
    debug: level >= 5 ? console.debug : noop,
    silly: level >= 6 ? console.debug : noop,
  }
}

function addHandleError(argv) {
  argv.handleError = error => {
    argv.logger.error(error)
    process.exit(1)
  }
}

function logArgv(argv) {
  argv.logger.debug(`Calling ${argv.$0} with argv:`, argv)
  return argv
}
