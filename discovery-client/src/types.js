// @flow

// TODO(mc, 2018-10-03): figure out what to do with duplicate type in app
export type HealthResponse = {
  name: string,
  api_version: string,
  fw_version: string,
  system_version?: string,
  logs?: Array<string>,
  protocol_api_version?: [number, number],
}

export type Capability =
  | 'bootstrap'
  | 'balenaUpdate'
  | 'buildrootMigration'
  | 'buildrootUpdate'
  | 'restart'

export type CapabilityMap = {
  [capabilityName: Capability]: ?string,
}

export type ServerHealthResponse = {
  name: string,
  apiServerVersion: string,
  updateServerVersion: string,
  smoothieVersion: string,
  systemVersion: string,
  capabilities?: CapabilityMap,
}

export type Candidate = {
  ip: string,
  port: number,
}

export type Service = {
  name: string,
  ip: ?string,
  port: number,
  // IP address (if known) is a link-local address
  local: ?boolean,
  // GET /health response.ok === true
  ok: ?boolean,
  // GET /server/health response.ok === true
  serverOk: ?boolean,
  // is advertising on MDNS
  advertising: ?boolean,
  // last good /health response
  health: ?HealthResponse,
  // last good /server/health response
  serverHealth: ?ServerHealthResponse,
}

export type ServiceUpdate = $Shape<Service>

export type ServiceList = Array<Service>

// TODO(mc, 2018-07-26): grab common logger type from app and app-shell
export type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'http'
  | 'verbose'
  | 'debug'
  | 'silly'

export type Log = (message: string, meta?: {}) => void

export type Logger = {
  error: Log,
  warn: Log,
  info: Log,
  http: Log,
  verbose: Log,
  debug: Log,
  silly: Log,
  ...
}
