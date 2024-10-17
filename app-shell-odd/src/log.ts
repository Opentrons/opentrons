// create logger function
import { inspect } from 'util'
import path from 'path'
import dateFormat from 'dateformat'
import winston from 'winston'

import { getConfig } from './config'

import Transport from 'winston-transport'
import type { Config } from './config'

const ODD_DIR = '/data/ODD'
const LOG_DIR = path.join(ODD_DIR, 'logs')
const ERROR_LOG = path.join(LOG_DIR, 'error.log')
const COMBINED_LOG = path.join(LOG_DIR, 'combined.log')
const FILE_OPTIONS = {
  // JSON logs
  format: winston.format.json(),
  // 1 MB max log file size (to ensure emailablity)
  maxsize: 1024 * 1024,
  // keep 10 backups at most
  maxFiles: 10,
  // roll filenames in accending order (larger the number, older the log)
  tailable: true,
}

// Use our own logger type because winston (a) doesn't allow these by default
// but (b) does it by binding something other than a function to these props.
export type OTLogger = Omit<
  winston.Logger,
  'emerg' | 'alert' | 'crit' | 'warning' | 'notice'
>

export function createLogger(label: string): OTLogger {
  const rootLogger = ensureRootLogger()
  return rootLogger.child({ label })
}

let _rootLog: OTLogger | null = null

function ensureRootLogger(): OTLogger {
  if (_rootLog == null) {
    return buildRootLogger()
  } else {
    return _rootLog
  }
}

function buildRootLogger(): OTLogger {
  const config = getConfig('log')

  const transports = createTransports(config)

  const formats = [
    winston.format.timestamp(),
    winston.format.metadata({
      key: 'meta',
      fillExcept: ['level', 'message', 'timestamp', 'label'],
    }),
  ]

  _rootLog = winston.createLogger({
    transports,
    format: winston.format.combine(...formats),
  })
  const loggingLog = _rootLog.child({ label: 'logging' })
  loggingLog.info(`Level "error" and higher logging to ${ERROR_LOG}`)
  loggingLog.info(
    `Level "${config.level.file}" and higher logging to ${COMBINED_LOG}`
  )
  loggingLog.info(
    `Level "${config.level.console}" and higher logging to console`
  )
  return _rootLog
}

function createTransports(config: Config['log']): Transport[] {
  const timeFromStamp = (ts: string): string =>
    dateFormat(new Date(ts), 'HH:MM:ss.l')

  return [
    // console log
    new winston.transports.Console({
      level: config.level.console,
      format: winston.format.combine(
        winston.format.printf(info => {
          const { level, message, timestamp, label } = info
          const time =
            typeof timestamp === 'string' ? timeFromStamp(timestamp) : ''
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          const print = `${time} [${label}] ${level}: ${message}`
          const meta = inspect(info.meta, { depth: 6 })

          if (meta !== '{}') return `${print} ${meta}`

          return print
        })
      ),
    }),
  ]
}
