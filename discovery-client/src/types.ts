import type { Agent } from 'http'

import type {
  RobotState,
  HostState,
  HealthStatus,
  Address,
} from './store/types'

export type { RobotState, HostState, HealthStatus, Address }

// TODO(mc, 2018-10-03): figure out what to do with duplicate type in app
export interface HealthResponse {
  name: string
  api_version: string
  fw_version: string
  system_version?: string
  logs?: string[]
  protocol_api_version?: [number, number]
  minimum_protocol_api_version?: [number, number]
  maximum_protocol_api_version?: [number, number]
  robot_model?: string
}

export type Capability =
  | 'bootstrap'
  | 'balenaUpdate'
  | 'buildrootMigration'
  | 'buildrootUpdate'
  | 'systemUpdate'
  | 'restart'

export type CapabilityMap = {
  [C in Capability]: string | null | undefined
}

export interface ServerHealthResponse {
  name: string
  apiServerVersion: string
  updateServerVersion: string
  serialNumber: string
  smoothieVersion: string
  systemVersion: string
  capabilities?: CapabilityMap
  bootId?: string
  robotModel?: string
}

export interface HealthErrorResponse {
  status: number
  body: string | { [property: string]: unknown }
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

export type Logger = Record<LogLevel, (message: string, meta?: unknown) => void>

/**
 * Health poll data for a given IP address
 */
export interface HealthPollerResult {
  /** IP address used for poll */
  ip: string
  /** Port used for poll */
  port: number
  /** GET /health data if server responded with 2xx */
  health: HealthResponse | null
  /** GET /server/update/health data if server responded with 2xx */
  serverHealth: ServerHealthResponse | null
  /** GET /health status code and body if response was non-2xx */
  healthError: HealthErrorResponse | null
  /** GET /server/update/health status code and body if response was non-2xx */
  serverHealthError: HealthErrorResponse | null
}

/**
 * Object describing something than can be polled for health. Inexact to avoid
 * coupling what the HealthPoller expects with what the DiscoveryClient needs
 * for its own state
 */
export interface HealthPollerTarget {
  /** IP address used to construct health URLs */
  ip: string
  /** Port address used to construct health URLs */
  port: number
  /** custom http agent used in request */
  agent?: Agent
}

/**
 * HealthPoller runtime configuration that can be changed by multiple calls
 * to start; previous config state will be preserved if left unspecified
 */
export interface HealthPollerConfig {
  /** List of addresses to poll */
  list?: HealthPollerTarget[]
  /** Call the health endpoints for a given IP once every `interval` ms */
  interval?: number
}

/**
 * Options used to construct a health poller
 */
export interface HealthPollerOptions {
  /** Function to call whenever the requests for an IP settle */
  onPollResult: (pollResult: HealthPollerResult) => unknown
  /** Optional logger */
  logger?: Logger
}

/**
 * A HealthPoller manages polling the HTTP health endpoints of a set of IP
 * addresses
 */
export interface HealthPoller {
  /**
   * (Re)start the poller, optionally passing in new configuration values.
   * Any unspecified config will be preserved from the last time `start` was
   * called. `start` must be called with an interval and list at least once.
   */
  start: (config?: HealthPollerConfig) => void
  /**
   * Stop the poller. In-flight HTTP requests may not be cancelled, but
   * `onPollResult` will no longer be called.
   */
  stop: () => void
}

/**
 * IP address and instantaneous health information for a given robot
 */
export type DiscoveryClientRobotAddress = Omit<HostState, 'robotName'>

/*
 * Robot object that the DiscoveryClient returns that combines latest known
 * health data from the robot along with possible IP addresses
 */
export interface DiscoveryClientRobot extends RobotState {
  /** IP addresses and health state, ranked by connectivity (descending) */
  addresses: DiscoveryClientRobotAddress[]
}

/**
 * Discovery Client runtime configuration that can be changed by multiple calls
 * to start; previous config state will be preserved if left unspecified
 */
export interface DiscoveryClientConfig {
  /** Health poll interval used by the HealthPoller */
  healthPollInterval?: number
  /** Robots list to (re)initialize the tracking state */
  initialRobots?: DiscoveryClientRobot[]
  /** Extra IP addresses to manually track */
  manualAddresses?: Address[]
}

/**
 * Permanent options used when constructing a Discovery Client
 */
export interface DiscoveryClientOptions {
  /** Function to call when the robots list is updated */
  onListChange: (robots: DiscoveryClientRobot[]) => unknown
  /** Optional logger */
  logger?: Logger
}

export interface DiscoveryClient {
  getRobots: () => DiscoveryClientRobot[]
  removeRobot: (robotName: string) => void
  start: (config: DiscoveryClientConfig) => void
  stop: () => void
}

/**
 * Legacy type used in previous version of Discovery Client for robot state
 */
export interface LegacyService {
  name: string
  ip: string | null | undefined
  port: number
  // IP address (if known) is a link-local address
  local: boolean | null | undefined
  // GET /health response.ok === true
  ok: boolean | null | undefined
  // GET /server/update/health response.ok === true
  serverOk: boolean | null | undefined
  // is advertising on MDNS
  advertising: boolean | null | undefined
  // last good /health response
  health: HealthResponse | null | undefined
  // last good /server/update/health response
  serverHealth: ServerHealthResponse | null | undefined
}
