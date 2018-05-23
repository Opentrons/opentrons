// create logger function
const {app} = require('electron')
const {inspect} = require('util')
const fse = require('fs-extra')
const path = require('path')
const dateFormat = require('dateformat')
const winston = require('winston')

const config = require('./config').getConfig('log')

const LOG_DIR = path.join(app.getPath('userData'), 'logs')
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
  tailable: true
}

let transports
let log

module.exports = function getLogger (filename) {
  if (!transports) initializeTransports()

  return createLogger(filename)
}

function initializeTransports () {
  let error = null

  // sync is ok here because this only happens once
  try {
    fse.ensureDirSync(LOG_DIR)
  } catch (e) {
    error = e
  }

  transports = createTransports()
  log = createLogger(__filename)

  if (error) log.error('Could not create log directory', {error})
  log.info(`Level "error" and higher logging to ${ERROR_LOG}`)
  log.info(`Level "${config.level.file}" and higher logging to ${COMBINED_LOG}`)
  log.info(`Level "${config.level.console}" and higher logging to console`)
}

function createTransports () {
  const timeFromStamp = ts => dateFormat(new Date(ts), 'HH:MM:ss.l')

  return [
    // error file log
    new winston.transports.File(Object.assign({
      level: 'error',
      filename: ERROR_LOG
    }, FILE_OPTIONS)),

    // regular combined file log
    new winston.transports.File(Object.assign({
      level: config.level.file,
      filename: COMBINED_LOG
    }, FILE_OPTIONS)),

    // console log
    new winston.transports.Console({
      level: config.level.console,
      format: winston.format.combine(
        winston.format.printf(info => {
          const {level, message, timestamp, label} = info
          const time = timeFromStamp(timestamp)
          const print = `${time} [${label}] ${level}: ${message}`
          const meta = inspect(info.meta, {depth: 6})

          if (meta !== '{}') return `${print} ${meta}`

          return print
        })
      )
    })
  ]
}

function createLogger (filename) {
  log && log.debug(`Creating logger for ${filename}`)

  const formats = [
    winston.format.timestamp(),
    winston.format.metadata({
      key: 'meta',
      fillExcept: ['level', 'message', 'timestamp', 'label']
    })
  ]

  if (filename) {
    const label = path.relative(
      path.join(__dirname, '../..'),
      filename
    )

    formats.unshift(winston.format.label({label}))
  }

  return winston.createLogger({
    transports,
    format: winston.format.combine(...formats)
  })
}
