// @flow
// logger
import { useRef } from 'react'

import type { Remote } from './shell/types'

export type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'http'
  | 'verbose'
  | 'debug'
  | 'silly'

export type Log = (message: string, meta?: {}) => void

export type LogEntry = { level: LogLevel, message: string, label: string, ... }

export type Logger = {|
  error: Log,
  warn: Log,
  info: Log,
  http: Log,
  verbose: Log,
  debug: Log,
  silly: Log,
  log: LogEntry => void,
|}

const ERROR: 'error' = 'error'
const WARN: 'warn' = 'warn'
const INFO: 'info' = 'info'
const HTTP: 'http' = 'http'
const VERBOSE: 'verbose' = 'verbose'
const DEBUG: 'debug' = 'debug'
const SILLY: 'silly' = 'silly'

let _remote: Remote | void

export function initializeLogs(remote: Remote): void {
  _remote = remote
}

export function createLogger(filename: string): Logger {
  const label = `app/${filename}`

  return {
    [ERROR]: (message, meta) => log(ERROR, message, label, meta),
    [WARN]: (message, meta) => log(WARN, message, label, meta),
    [INFO]: (message, meta) => log(INFO, message, label, meta),
    [HTTP]: (message, meta) => log(HTTP, message, label, meta),
    [VERBOSE]: (message, meta) => log(VERBOSE, message, label, meta),
    [DEBUG]: (message, meta) => log(DEBUG, message, label, meta),
    [SILLY]: (message, meta) => log(SILLY, message, label, meta),
    log: ({ level, message, label, ...meta }) => {
      log(level, message, label, meta)
    },
  }
}

function log(level: LogLevel, message: string, label: string, meta?: { ... }) {
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

  // send to main process for log file collection
  _remote && _remote.log({ ...meta, level, message, label })
}

export function useLogger(filename: string): Logger {
  const loggerRef = useRef<Logger | null>(null)

  const getLogger = (): Logger => {
    if (loggerRef.current === null) {
      loggerRef.current = createLogger(filename)
    }

    return loggerRef.current
  }

  return getLogger()
}
