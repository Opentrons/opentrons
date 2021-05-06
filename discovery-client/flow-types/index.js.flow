// @flow
// NOTE(mc, 2021-02-12): this file must be manually kept in sync with
// the TypeScript source until Flow is no longer used in the discovery
// client's dependent projects (app and app-shell).

// constants - src/constants.ts

declare export var HEALTH_STATUS_UNREACHABLE: 'unreachable'
declare export var HEALTH_STATUS_NOT_OK: 'notOk'
declare export var HEALTH_STATUS_OK: 'ok'
declare export var ROBOT_SERVER_HEALTH_PATH: string
declare export var UPDATE_SERVER_HEALTH_PATH: string
declare export var DEFAULT_PORT: number
declare export var RE_HOSTNAME_IPV6_LL: RegExp
declare export var RE_HOSTNAME_IPV4_LL: RegExp
declare export var RE_HOSTNAME_LOCALHOST: RegExp
declare export var RE_HOSTNAME_LOOPBACK: RegExp

// types - src/types.ts

/**
 * Health endpoint status, where a given endpoint is one of:
 * - Unreachable: fetch failed completely
 * - Not ok: Fetch was successful, but the status code was not 2xx
 * - Ok: Fetch was successful and status code was 2xx
 */
export type HealthStatus =
  | typeof HEALTH_STATUS_UNREACHABLE
  | typeof HEALTH_STATUS_NOT_OK
  | typeof HEALTH_STATUS_OK

export type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'http'
  | 'verbose'
  | 'debug'
  | 'silly'

export type Logger = {
  [level: LogLevel]: (message: string, meta?: mixed) => void,
  ...
}

export type Capability =
  | 'bootstrap'
  | 'balenaUpdate'
  | 'buildrootMigration'
  | 'buildrootUpdate'
  | 'restart'

export type CapabilityMap = {
  [c: Capability]: string | null | void,
  ...
}

export type HealthResponse = {
  name: string,
  api_version: string,
  fw_version: string,
  system_version?: string,
  logs?: string[],
  protocol_api_version?: [number, number],
  minimum_protocol_api_version?: [number, number],
  maximum_protocol_api_version?: [number, number],
  ...
}

export type ServerHealthResponse = {
  name: string,
  apiServerVersion: string,
  updateServerVersion: string,
  smoothieVersion: string,
  systemVersion: string,
  capabilities?: CapabilityMap,
  bootId?: string,
  ...
}

export type HealthErrorResponse = {
  status: number,
  body: string | { [property: string]: mixed },
  ...
}

/**
 * Health state of a given robot
 */
export type RobotState = {|
  /** unique name of the robot */
  name: string,
  /** latest /health response data from the robot */
  health: HealthResponse | null,
  /** latest /server/update/health response data from the robot */
  serverHealth: ServerHealthResponse | null,
|}

export type Address = {|
  /** IP address */
  ip: string,
  /** Port */
  port: number,
|}

/**
 * State for a given IP address, which should point to a robot
 */
export type HostState = {|
  ...Address,
  /** Whether this IP has been seen via mDNS or HTTP while the client has been running */
  seen: boolean,
  /** How the last GET /health responded (null if no response yet) */
  healthStatus: HealthStatus | null,
  /** How the last GET /server/update/health responded (null if no response yet) */
  serverHealthStatus: HealthStatus | null,
  /** Error status and response from /health if last request was not 200 */
  healthError: HealthErrorResponse | null,
  /** Error status and response from /server/update/health if last request was not 200 */
  serverHealthError: HealthErrorResponse | null,
  /** Robot that this IP points to */
  robotName: string,
|}

/**
 * IP address and instantaneous health information for a given robot
 */
export type DiscoveryClientRobotAddress = $Diff<
  HostState,
  {| robotName: mixed |}
>

/*
 * Robot object that the DiscoveryClient returns that combines latest known
 * health data from the robot along with possible IP addressess
 */
export type DiscoveryClientRobot = {|
  ...RobotState,
  /** IP addresses and health state, ranked by connectability (descending) */
  addresses: DiscoveryClientRobotAddress[],
|}

/**
 * Discovery Client runtime configuration that can be changed by multiple calls
 * to start; previous config state will be preserved if left unspecified
 */
export type DiscoveryClientConfig = {|
  /** Health poll interval used by the HealthPoller */
  healthPollInterval?: number,
  /** Robots list to (re)initialize the tracking state */
  initialRobots?: DiscoveryClientRobot[],
  /** Extra IP addresses to manially track */
  manualAddresses?: Address[],
|}

/**
 * Permanent options used when constructing a Discovery Client
 */
export type DiscoveryClientOptions = {|
  /** Function to call when the robots list is updated */
  onListChange: (robots: DiscoveryClientRobot[]) => mixed,
  /** Optional logger */
  logger?: Logger,
|}

export interface DiscoveryClient {
  getRobots: () => DiscoveryClientRobot[];
  removeRobot: (robotName: string) => void;
  start: (config: DiscoveryClientConfig) => void;
  stop: () => void;
}

/**
 * Legacy type used in previous version of Discovery Client for robot state
 */
export type LegacyService = {|
  name: string,
  ip: string | null | void,
  port: number,
  // IP address (if known) is a link-local address
  local: boolean | null | void,
  // GET /health response.ok === true
  ok: boolean | null | void,
  // GET /server/update/health response.ok === true
  serverOk: boolean | null | void,
  // is advertising on MDNS
  advertising: boolean | null | void,
  // last good /health response
  health: HealthResponse | null | void,
  // last good /server/update/health response
  serverHealth: ServerHealthResponse | null | void,
|}

declare export function createDiscoveryClient(
  options: DiscoveryClientOptions
): DiscoveryClient
