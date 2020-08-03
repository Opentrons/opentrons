// @flow

export {
  HEALTH_STATUS_OK,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_UNREACHABLE,
  RE_HOSTNAME_IPV6_LL,
  RE_HOSTNAME_IPV4_LL,
  RE_HOSTNAME_LOCALHOST,
  RE_HOSTNAME_LOOPBACK,
} from '@opentrons/discovery-client/src/constants'

export const CONNECTABLE: 'connectable' = 'connectable'
export const REACHABLE: 'reachable' = 'reachable'
export const UNREACHABLE: 'unreachable' = 'unreachable'
