// @flow

// TODO(mc, 2018-10-03): figure out what to do with duplicate type in app
export type HealthResponse = {
  name: string,
  api_version: string,
  fw_version: string,
  system_version?: string,
  logs?: Array<string>,
  protocol_api_version?: [number, number],
  ...
}

export type Capability =
  | 'bootstrap'
  | 'balenaUpdate'
  | 'buildrootMigration'
  | 'buildrootUpdate'
  | 'restart'

export type CapabilityMap = {
  [capabilityName: Capability]: ?string,
  ...,
}

export type ServerHealthResponse = {
  name: string,
  apiServerVersion: string,
  updateServerVersion: string,
  smoothieVersion: string,
  systemVersion: string,
  capabilities?: CapabilityMap,
  ...
}

export type HealthErrorResponse = {|
  status: number,
  body: string | { [string]: mixed, ... },
|}

export type Candidate = {
  ip: string,
  port: number,
  ...
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
  ...
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

export type Logger = { [level: LogLevel]: (message: string, meta?: {}) => void }

/**
 * Health poll data for a given IP address
 */
export type HealthPollerResult = $ReadOnly<{|
  /** IP address used for poll */
  ip: string,
  /** Port used for poll */
  port: number,
  /** GET /health data if server responded with 2xx */
  health: HealthResponse | null,
  /** GET /server/health data if server responded with 2xx */
  serverHealth: ServerHealthResponse | null,
  /** GET /health status code and body if response was non-2xx */
  healthError: HealthErrorResponse | null,
  /** GET /server/health status code and body if response was non-2xx */
  serverHealthError: HealthErrorResponse | null,
|}>

/**
 * Object describing something than can be polled for health. Inexact to avoid
 * coupling what the HealthPoller expects with what the DiscoveryClient needs
 * for its own state
 */
export type HealthPollerTarget = $ReadOnly<{
  ip: string,
  port: number,
  ...
}>

/**
 * Base configuration options of a HealthPoller
 */
export type HealthPollerConfig = $ReadOnly<{|
  /** List of addresses to poll */
  list: $ReadOnlyArray<HealthPollerTarget>,
  /** Call the health endpoints for a given IP once every `interval` ms */
  interval: number,
|}>

/**
 * Options used to construct a health poller
 */
export type HealthPollerOptions = $ReadOnly<{|
  ...HealthPollerConfig,
  /** Function to call whenever the requests for an IP settle */
  onPollResult: (pollResult: HealthPollerResult) => mixed,
  /** Optional logger */
  logger?: Logger,
|}>

/**
 * A HealthPoller manages polling the HTTP health endpoints of a set of IP
 * addresses
 */
export type HealthPoller = $ReadOnly<{|
  /** (Re)start the poller, optionally passing in a new configuration */
  start: (startOpts?: $Partial<HealthPollerConfig>) => void,
  /** Stop the poller (will not cancel any in-flight HTTP requests) */
  stop: () => void,
|}>
