// @flow

import {
  CONNECTABLE,
  REACHABLE,
  HEALTH_STATUS_OK,
  HEALTH_STATUS_NOT_OK,
} from '../constants'

import type { BaseRobot, Robot, ReachableRobot } from '../types'

export const mockHealthResponse = {
  name: 'robot-name',
  api_version: '0.0.0-mock',
  fw_version: '0.0.0-mock',
  system_version: '0.0.0-mock',
  logs: ([]: Array<string>),
  protocol_api_version: ([2, 0]: [number, number]),
}

export const mockUpdateServerHealthResponse = {
  name: 'robot-name',
  apiServerVersion: '0.0.0-mock',
  updateServerVersion: '0.0.0-mock',
  smoothieVersion: '0.0.0-mock',
  systemVersion: '0.0.0-mock',
  capabilities: ({}: { ... }),
}

export const mockDiscoveryClientRobot = {
  name: 'robot-name',
  health: mockHealthResponse,
  serverHealth: mockUpdateServerHealthResponse,
  addresses: [
    {
      ip: '127.0.0.1',
      port: 31950,
      seen: true,
      healthStatus: HEALTH_STATUS_OK,
      serverHealthStatus: HEALTH_STATUS_OK,
      healthError: null,
      serverHealthError: null,
    },
  ],
}

export const mockBaseRobot: BaseRobot = {
  name: 'opentrons-robot-name',
  displayName: 'robot-name',
  connected: false,
  seen: false,
  local: null,
  health: null,
  serverHealth: null,
}

export const mockConnectableRobot: Robot = {
  ...mockBaseRobot,
  status: CONNECTABLE,
  health: mockHealthResponse,
  serverHealth: mockUpdateServerHealthResponse,
  healthStatus: HEALTH_STATUS_OK,
  serverHealthStatus: HEALTH_STATUS_OK,
  ip: '127.0.0.1',
  port: 31950,
  seen: true,
}

export const mockConnectedRobot: Robot = {
  ...mockConnectableRobot,
  connected: true,
}

export const mockReachableRobot: ReachableRobot = {
  ...mockBaseRobot,
  status: REACHABLE,
  health: mockHealthResponse,
  serverHealth: mockUpdateServerHealthResponse,
  healthStatus: HEALTH_STATUS_NOT_OK,
  serverHealthStatus: HEALTH_STATUS_OK,
  ip: '127.0.0.1',
  port: 31950,
  seen: true,
}
