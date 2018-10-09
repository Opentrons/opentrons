// @flow

import type {Service} from '@opentrons/discovery-client'

// service with a known IP address
export type ResolvedRobot = {
  ...$Exact<Service>,
  ip: $NonMaybeType<$PropertyType<Service, 'ip'>>,
  local: $NonMaybeType<$PropertyType<Service, 'local'>>,
  ok: $NonMaybeType<$PropertyType<Service, 'ok'>>,
  serverOk: $NonMaybeType<$PropertyType<Service, 'serverOk'>>,
}

// fully connectable robot
export type Robot = {
  ...$Exact<ResolvedRobot>,
  ok: true,
  health: $NonMaybeType<$PropertyType<Service, 'health'>>,
  status: 'connectable',
  connected: boolean,
}

// robot with a known IP (i.e. advertising over mDNS) but unconnectable
export type ReachableRobot = {
  ...$Exact<ResolvedRobot>,
  ok: false,
  status: 'reachable',
}

export type ViewableRobot = Robot | ReachableRobot

// robot with an unknown IP
export type UnreachableRobot = {
  ...$Exact<Service>,
  status: 'unreachable',
}
