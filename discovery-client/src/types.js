// @flow

export type Candidate = {
  ip: string,
  port: ?number,
}

export type Service = {
  name: string,
  ip: ?string,
  port: ?number,
  ok: ?boolean,
}

// TODO(mc, 2018-07-26): grab common logger type from app and app-shell
export type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'http'
  | 'verbose'
  | 'debug'
  | 'silly'

export type Logger = {[level: LogLevel]: (message: string, meta?: {}) => void}

// note: the discovery module only cares about name
export type HealthResponse = {
  name: string,
}
