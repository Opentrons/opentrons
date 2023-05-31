// create logger function
import { inspect } from 'util'
import fse from 'fs-extra'
import path from 'path'
import dateFormat from 'dateformat'
import winston from 'winston'

import { getConfig } from './config'

import type Transport from 'winston-transport'
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

let config: Config['log']
let transports: Transport[]
let log: winston.Logger

export function createLogger(filename: string): winston.Logger {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!config) config = getConfig('log')
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!transports) initializeTransports()

  return createWinstonLogger(filename)
}

function initializeTransports(): void {
  let error = null

  // sync is ok here because this only happens once
  try {
    fse.ensureDirSync(LOG_DIR)
  } catch (e: unknown) {
    error = e
  }

  transports = createTransports()
  log = createWinstonLogger('log')

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (error) log.error('Could not create log directory', { error })
  log.info(`Level "error" and higher logging to ${ERROR_LOG}`)
  log.info(`Level "${config.level.file}" and higher logging to ${COMBINED_LOG}`)
  log.info(`Level "${config.level.console}" and higher logging to console`)
}

function createTransports(): Transport[] {
  const timeFromStamp = (ts: string): string =>
    dateFormat(new Date(ts), 'HH:MM:ss.l')

  return [
    // error file log
    new winston.transports.File(
      Object.assign(
        {
          level: 'error',
          filename: ERROR_LOG,
        },
        FILE_OPTIONS
      )
    ),

    // regular combined file log
    new winston.transports.File(
      Object.assign(
        {
          level: config.level.file,
          filename: COMBINED_LOG,
        },
        FILE_OPTIONS
      )
    ),

    // console log
    new winston.transports.Console({
      level: config.level.console,
      format: winston.format.combine(
        winston.format.printf(info => {
          const { level, message, timestamp, label } = info
          const time = timeFromStamp(timestamp)
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

function createWinstonLogger(label: string): winston.Logger {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain
  log && log.debug(`Creating logger for ${label}`)

  const formats = [
    winston.format.label({ label }),
    winston.format.timestamp(),
    winston.format.metadata({
      key: 'meta',
      fillExcept: ['level', 'message', 'timestamp', 'label'],
    }),
  ]

  return winston.createLogger({
    transports,
    format: winston.format.combine(...formats),
  })
}
