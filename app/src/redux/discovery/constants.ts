export const CONNECTABLE: 'connectable' = 'connectable'
export const REACHABLE: 'reachable' = 'reachable'
export const UNREACHABLE: 'unreachable' = 'unreachable'
export const ROBOT_MODEL_OT2: 'OT-2 Standard' = 'OT-2 Standard'
export const ROBOT_MODEL_OT3: 'OT-3 Standard' = 'OT-3 Standard'

// TODO(mc, 2021-02-17): values below duplicated from Discovery Client source
// discovery-client/src/constants.ts
// Import directly from DC when `app` is in TypeScript

// health status
export const HEALTH_STATUS_UNREACHABLE: 'unreachable' = 'unreachable'
export const HEALTH_STATUS_NOT_OK: 'notOk' = 'notOk'
export const HEALTH_STATUS_OK: 'ok' = 'ok'

// health endpoint paths
export const ROBOT_SERVER_HEALTH_PATH = '/health'
export const UPDATE_SERVER_HEALTH_PATH = '/server/update/health'

// mdns service filters
export const DEFAULT_PORT = 31950

// hostname matchers
// ipv6 matcher includes square bracket for backwards compatibility
export const RE_HOSTNAME_IPV6_LL: RegExp = /^\[?(?:fd00|fe80)/
export const RE_HOSTNAME_IPV4_LL: RegExp = /^169\.254\.\d+\.\d+$/
export const RE_HOSTNAME_LOCALHOST: RegExp = /^localhost$/
export const RE_HOSTNAME_LOOPBACK: RegExp = /^127\.0\.0\.1$/

export const RE_ROBOT_MODEL_OT3: RegExp = /^(OT-3)|(Opentrons Flex).*/
export const RE_ROBOT_MODEL_OT2: RegExp = /^OT-2.*/

// opentrons-usb hostname assigned to device detected by USB
export const OPENTRONS_USB: 'opentrons-usb' = 'opentrons-usb'
