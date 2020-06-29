// @flow

import { CONNECTABLE, REACHABLE } from '../selectors'
import type { ReachableRobot, ResolvedRobot, Robot, Service } from '../types'

export const mockHealthResponse = {
  name: 'robot-name',
  api_version: '0.0.0-mock',
  fw_version: '0.0.0-mock',
  system_version: '0.0.0-mock',
  logs: ([]: Array<string>),
  protocol_api_version: [2, 0],
}

export const mockUpdateServerHealthResponse = {
  name: 'robot-name',
  apiServerVersion: '0.0.0-mock',
  updateServerVersion: '0.0.0-mock',
  smoothieVersion: '0.0.0-mock',
  systemVersion: '0.0.0-mock',
  capabilities: ({}: { ... }),
}

export const mockService: $Exact<Service> = {
  name: 'robot-name',
  ip: null,
  port: 31950,
  local: true,
  ok: null,
  serverOk: null,
  advertising: null,
  health: null,
  serverHealth: null,
}

export const mockResolvedRobot: ResolvedRobot = {
  ...mockService,
  ip: '127.0.0.1',
  local: true,
  ok: true,
  serverOk: true,
  displayName: 'robot-name',
}

export const mockConnectableRobot: Robot = {
  ...mockResolvedRobot,
  ok: true,
  health: mockHealthResponse,
  serverHealth: mockUpdateServerHealthResponse,
  status: CONNECTABLE,
  connected: false,
}

export const mockConnectedRobot: Robot = {
  ...mockConnectableRobot,
  connected: true,
}

export const mockReachableRobot: ReachableRobot = {
  ...mockResolvedRobot,
  ok: false,
  status: REACHABLE,
}
