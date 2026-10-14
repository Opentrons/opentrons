// logger
import { useRef } from 'react'

// TODO(mc, 2018-05-17): put this type somewhere common to app and app-shell
export type LogLevel =
  'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'

export type Log = (message: string, meta?: {}) => void

export interface Logger {
  error: Log
  warn: Log
  info: Log
  http: Log
  verbose: Log
  debug: Log
  silly: Log
}

const ERROR: 'error' = 'error'
const WARN: 'warn' = 'warn'
const INFO: 'info' = 'info'
const HTTP: 'http' = 'http'
const VERBOSE: 'verbose' = 'verbose'
const DEBUG: 'debug' = 'debug'
const SILLY: 'silly' = 'silly'

export function createLogger(filename: string): Logger {
  const label = `app/${filename}`

  return {
    [ERROR]: (message, meta) => {
      log(ERROR, message, label, meta)
    },
    [WARN]: (message, meta) => {
      log(WARN, message, label, meta)
    },
    [INFO]: (message, meta) => {
      log(INFO, message, label, meta)
    },
    [HTTP]: (message, meta) => {
      log(HTTP, message, label, meta)
    },
    [VERBOSE]: (message, meta) => {
      log(VERBOSE, message, label, meta)
    },
    [DEBUG]: (message, meta) => {
      log(DEBUG, message, label, meta)
    },
    [SILLY]: (message, meta) => {
      log(SILLY, message, label, meta)
    },
  }
}

function log(
  level: LogLevel,
  message: string,
  label: string,
  meta?: Record<string, unknown>
): void {
  const print = `[${label}]: ${message}`

  let logfn = console.log
  // log to web console, too
  switch (level) {
    case 'error':
      logfn = console.error
      break
    case 'warn':
      logfn = console.warn
      break
    case 'info':
      logfn = console.info
      break
    case 'debug':
      logfn = console.debug
      break
    case 'silly':
      logfn = console.debug
      break
  }

  logfn(print)

  if (meta && Object.getOwnPropertyNames(meta).length !== 0) {
    logfn(meta)
  }
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
