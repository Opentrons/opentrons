// @flow

import type { RobotState, HostState, Address } from './store/types'

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
  // GET /server/update/health response.ok === true
  serverOk: ?boolean,
  // is advertising on MDNS
  advertising: ?boolean,
  // last good /health response
  health: ?HealthResponse,
  // last good /server/update/health response
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
  /** GET /server/update/health data if server responded with 2xx */
  serverHealth: ServerHealthResponse | null,
  /** GET /health status code and body if response was non-2xx */
  healthError: HealthErrorResponse | null,
  /** GET /server/update/health status code and body if response was non-2xx */
  serverHealthError: HealthErrorResponse | null,
|}>

/**
 * Object describing something than can be polled for health. Inexact to avoid
 * coupling what the HealthPoller expects with what the DiscoveryClient needs
 * for its own state
 */
export type HealthPollerTarget = $ReadOnly<{
  /** IP address used to contruct health URLs */
  ip: string,
  /** Port address used to construct health URLs */
  port: number,
  ...
}>

/**
 * HealthPoller runtime configuration that can be changed by multiple calls
 * to start; previous config state will be preserved if left unspecified
 */
export type HealthPollerConfig = $ReadOnly<{|
  /** List of addresses to poll */
  list?: $ReadOnlyArray<HealthPollerTarget>,
  /** Call the health endpoints for a given IP once every `interval` ms */
  interval?: number,
|}>

/**
 * Options used to construct a health poller
 */
export type HealthPollerOptions = $ReadOnly<{|
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
  /**
   * (Re)start the poller, optionally passing in new configuration values.
   * Any unspecified config will be preserved from the last time `start` was
   * called. `start` must be called with an interval and list at least once.
   */
  start: (config?: HealthPollerConfig) => void,
  /**
   * Stop the poller. In-flight HTTP requests may not be cancelled, but
   * `onPollResult` will no longer be called.
   */
  stop: () => void,
|}>

/**
 * Relavent data from an mDNS advertisement
 */
export type MdnsBrowserService = $ReadOnly<{|
  /** The service's name from the advertisement */
  name: string,
  /** The IP address that the service is using */
  ip: string,
  /** The port the service is using */
  port: number,
|}>

/**
 * Options used to construct an mDNS browser
 */
export type MdnsBrowserOptions = $ReadOnly<{|
  /** list of allowed ports; if empty, no services will be emitted */
  ports: $ReadOnlyArray<number>,
  /** Function to call whenever a service is discovered on mDNS */
  onService: (service: MdnsBrowserService) => mixed,
  /** Optional logger */
  logger?: Logger,
|}>

/**
 * An mDNS browser that can be started and stopped as needed
 */
export type MdnsBrowser = $ReadOnly<{|
  /** Start discovering services */
  start: () => void,
  /** Stop discovering services and tear down the underlying browser */
  stop: () => void,
|}>

/**
 * IP address and instantaneous health information for a given robot
 */
export type DiscoveryClientRobotAddress = $Rest<
  HostState,
  {| robotName: mixed |}
>
/*
 * Robot object that the DiscoveryClient returns that combines latest known
 * health data from the robot along with possible IP addressess
 */
export type DiscoveryClientRobot = $ReadOnly<{|
  ...RobotState,
  /** IP addresses and health state, ranked by connectability (descending) */
  addresses: $ReadOnlyArray<DiscoveryClientRobotAddress>,
|}>

/**
 * Discovery Client runtime configuration that can be changed by multiple calls
 * to start; previous config state will be preserved if left unspecified
 */
export type DiscoveryClientConfig = $ReadOnly<{|
  /** Health poll interval used by the HealthPoller */
  healthPollInterval?: number,
  /** Robots list to (re)initialize the tracking state */
  initialRobots?: $ReadOnlyArray<DiscoveryClientRobot>,
  /** Extra IP addresses to manially track */
  manualAddresses?: $ReadOnlyArray<Address>,
|}>

/**
 * Permanent options used when constructing a Discovery Client
 */
export type DiscoveryClientOptions = $ReadOnly<{|
  /** Function to call when the robots list is updated */
  onListChange: (robots: $ReadOnlyArray<DiscoveryClientRobot>) => mixed,
  /** Optional logger */
  logger?: Logger,
|}>

export type DiscoveryClientNext = $ReadOnly<{|
  getRobots: () => $ReadOnlyArray<DiscoveryClientRobot>,
  removeRobot: (robotName: string) => void,
  start: (config: DiscoveryClientConfig) => void,
  stop: () => void,
|}>
