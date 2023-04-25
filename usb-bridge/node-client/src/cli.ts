import Yargs from 'yargs'
import { buildUSBAgent } from './usb-agent'
import fetch from 'node-fetch'

import type { MiddlewareFunction } from 'yargs'

type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'http'
  | 'verbose'
  | 'debug'
  | 'silly'

const LOG_LVLS: LogLevel[] = [
  'error',
  'warn',
  'info',
  'http',
  'verbose',
  'debug',
  'silly',
]

type Logger = Record<LogLevel, (message: string, meta?: unknown) => void>

interface Argv {
  logLevel: LogLevel | string
}

interface CurlArgv extends Argv {
  serialPath: string
  method: string
  httpPath: string
}

const createLogger = (argv: Argv): Logger => {
  const level = (LOG_LVLS as string[]).indexOf(argv.logLevel)

  return {
    error: level >= 0 ? console.error : () => {},
    warn: level >= 1 ? console.warn : () => {},
    info: level >= 2 ? console.info : () => {},
    http: level >= 3 ? console.debug : () => {},
    verbose: level >= 4 ? console.debug : () => {},
    debug: level >= 5 ? console.debug : () => {},
    silly: level >= 6 ? console.debug : () => {},
  }
}

const debugLogArgvMiddleware: MiddlewareFunction<Argv> = (argv): void => {
  const log = createLogger(argv)
  log.debug(`Calling ${argv.$0} with argv:`, argv)

  // @ts-expect-error(mc, 2021-02-16): this return is probably unnecessary, remove
  return argv
}

function curl(argv: CurlArgv): void {
  const log = createLogger(argv)
  log.verbose(`building agent for ${argv.serialPath}`)
  const agent = buildUSBAgent({ serialPort: argv.serialPath })
  const fakePath = `http://www.company.com/${argv.httpPath}`
  log.info(`starting fetch to ${fakePath}`)
  fetch(fakePath, {
    method: argv.method,
    agent: agent,
    headers: {
      'opentrons-version': '2',
    },
  })
    .then(res => res.text())
    .then(text => console.log(text))
    .finally(() => {
      log.info('done, closing connection')
      agent.destroy()
    })
}

Yargs.options({
  logLevel: {
    describe: 'Log level',
    alias: 'l',
    choices: [...LOG_LVLS, 'off'],
    default: 'info',
  },
})
  .middleware([debugLogArgvMiddleware])
  .command(
    'usb-curl <serialPath> <method> <httpPath>',
    'Provide a curl-like interface that will make a request via the specified USB serial',
    yargs => {
      yargs.positional('serialPath', {
        describe: 'Path to serial port to communicate with',
        type: 'string',
      })
      yargs.positional('method', {
        describe: 'HTTP method',
        type: 'string',
      })
      yargs.positional('httpPath', {
        describe: 'Path to query',
        type: 'string',
      })
    },
    curl
  )
  .strict()
  .version(_PKG_VERSION_)
  .help()
  .parse()
