// @flow
// logger
import {ipcRenderer} from 'electron'

// TODO(mc, 2018-05-17): put this type somewhere common to app and app-shell
export type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'http'
  | 'verbose'
  | 'debug'
  | 'silly'

type Logger = {[level: LogLevel]: (message: string, meta?: {}) => void}

const LEVELS: Array<LogLevel> = [
  'error',
  'warn',
  'info',
  'http',
  'verbose',
  'debug',
  'silly',
]

export default function createLogger (filename: string): Logger {
  const label = `app/${filename}`

  return LEVELS.reduce((result, level) => ({
    ...result,
    [level]: (message, meta) => log(level, message, label, meta),
  }), {})
}

function log (level: LogLevel, message: string, label: string, meta?: {}) {
  const print = `[${label}] ${level}: ${message}`

  // log to web console, too
  if (level === 'error') {
    console.error(print)
  } else if (level === 'warn') {
    console.warn(print)
  } else if (level === 'info') {
    console.info(print)
  } else {
    console.log(print)
  }

  if (meta && Object.getOwnPropertyNames(meta).length !== 0) {
    console.dir(meta)
  }

  // send to main process for logfile collection
  ipcRenderer.send('log', {level, message, label, ...meta})
}
