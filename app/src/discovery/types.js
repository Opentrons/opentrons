// @flow

import type {Service} from '@opentrons/discovery-client'

// service with a known IP address
export type ResolvedService = {
  ...$Exact<Service>,
  ip: $NonMaybeType<$PropertyType<Service, 'ip'>>,
  local: $NonMaybeType<$PropertyType<Service, 'local'>>,
  ok: $NonMaybeType<$PropertyType<Service, 'ok'>>,
  serverOk: $NonMaybeType<$PropertyType<Service, 'serverOk'>>,
}

// fully connectable robot
export type Robot = {
  ...$Exact<ResolvedService>,
  ok: true,
  health: $NonMaybeType<$PropertyType<Service, 'health'>>,
}

// robot with a known IP (i.e. advertising over mDNS) but unconnectable
export type ReachableRobot =
  | {...$Exact<ResolvedService>, ok: false, serverOk: true}
  | {...$Exact<ResolvedService>, ok: false, advertising: true}

// robot with an unknown IP
export type UnreachableRobot = Service
