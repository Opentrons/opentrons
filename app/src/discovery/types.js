// @flow

import type {Service} from '@opentrons/discovery-client'

export type ConnectableStatus = 'connectable'
export type ReachableStatus = 'reachable'
export type UnreachableStatus = 'unreachable'

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
  status: ConnectableStatus,
  connected: boolean,
}

// robot with a known IP (i.e. advertising over mDNS) but unconnectable
export type ReachableRobot = {
  ...$Exact<ResolvedRobot>,
  ok: false,
  status: ReachableStatus,
}

// robot with an unknown IP
export type UnreachableRobot = {
  ...$Exact<Service>,
  status: UnreachableStatus,
}

export type ViewableRobot = Robot | ReachableRobot

export type AnyRobot = Robot | ReachableRobot | UnreachableRobot
