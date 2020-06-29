// create logger function
import dateFormat from 'dateformat'
import { app } from 'electron'
import fse from 'fs-extra'
import path from 'path'
import { inspect } from 'util'
import winston from 'winston'

import { getConfig } from './config'

export const LOG_DIR = path.join(app.getPath('userData'), 'logs')
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

let config
let transports
let log

export function createLogger(filename) {
  if (!config) config = getConfig('log')
  if (!transports) initializeTransports()

  return createWinstonLogger(filename)
}

function initializeTransports() {
  let error = null

  // sync is ok here because this only happens once
  try {
    fse.ensureDirSync(LOG_DIR)
  } catch (e) {
    error = e
  }

  transports = createTransports()
  log = createWinstonLogger('log')

  if (error) log.error('Could not create log directory', { error })
  log.info(`Level "error" and higher logging to ${ERROR_LOG}`)
  log.info(`Level "${config.level.file}" and higher logging to ${COMBINED_LOG}`)
  log.info(`Level "${config.level.console}" and higher logging to console`)
}

function createTransports() {
  const timeFromStamp = ts => dateFormat(new Date(ts), 'HH:MM:ss.l')

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
          const print = `${time} [${label}] ${level}: ${message}`
          const meta = inspect(info.meta, { depth: 6 })

          if (meta !== '{}') return `${print} ${meta}`

          return print
        })
      ),
    }),
  ]
}

function createWinstonLogger(label) {
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
