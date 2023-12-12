import {
  CONNECTABLE,
  REACHABLE,
  UNREACHABLE,
  HEALTH_STATUS_OK,
  HEALTH_STATUS_NOT_OK,
} from '../constants'

import type {
  BaseRobot,
  Robot,
  ReachableRobot,
  UnreachableRobot,
} from '../types'

export const mockHealthResponse = {
  name: 'robot-name',
  api_version: '0.0.0-mock',
  fw_version: '0.0.0-mock',
  system_version: '0.0.0-mock',
  logs: [] as string[],
  protocol_api_version: [2, 0] as [number, number],
}

export const mockHealthResponseWithSerial = {
  ...mockHealthResponse,
  robot_serial: 'this is a robot serial from robot server',
}

export const mockUpdateServerHealthResponse = {
  name: 'robot-name',
  apiServerVersion: '0.0.0-mock',
  updateServerVersion: '0.0.0-mock',
  smoothieVersion: '0.0.0-mock',
  systemVersion: '0.0.0-mock',
  capabilities: {},
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

export const mockDiscoveryClientRobotWithHealthSerial = {
  ...mockDiscoveryClientRobot,
  health: mockHealthResponseWithSerial,
}

export const mockBaseRobot: BaseRobot = {
  // NOTE(mc, 2020-11-10): it's important that name and displayName are
  // different in this fixture to ensure proper test coverage
  name: 'opentrons-robot-name',
  displayName: 'robot-name',
  seen: false,
  local: null,
  health: null,
  serverHealth: null,
  robotModel: 'OT-2 Standard',
}

export const mockConnectableRobot: Robot = {
  ...mockBaseRobot,
  status: CONNECTABLE,
  health: mockHealthResponse,
  serverHealth: mockUpdateServerHealthResponse as Robot['serverHealth'],
  healthStatus: HEALTH_STATUS_OK,
  serverHealthStatus: HEALTH_STATUS_OK,
  ip: '127.0.0.1',
  port: 31950,
  seen: true,
}

export const mockConnectedRobot: Robot = {
  ...mockConnectableRobot,
}

export const mockReachableRobot: ReachableRobot = {
  ...mockBaseRobot,
  status: REACHABLE,
  health: mockHealthResponse,
  serverHealth: mockUpdateServerHealthResponse as Robot['serverHealth'],
  healthStatus: HEALTH_STATUS_NOT_OK,
  serverHealthStatus: HEALTH_STATUS_OK,
  ip: '127.0.0.1',
  port: 31950,
  seen: true,
}

export const mockUnreachableRobot: UnreachableRobot = {
  ...mockBaseRobot,
  status: UNREACHABLE,
  health: mockHealthResponse,
  serverHealth: mockUpdateServerHealthResponse as Robot['serverHealth'],
  healthStatus: HEALTH_STATUS_NOT_OK,
  serverHealthStatus: HEALTH_STATUS_OK,
  ip: '127.0.0.1',
  port: 31950,
  seen: true,
}
