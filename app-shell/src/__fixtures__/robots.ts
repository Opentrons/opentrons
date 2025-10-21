import { HEALTH_STATUS_NOT_OK, HEALTH_STATUS_OK } from '../constants'

export const mockLegacyHealthResponse = {
  name: 'opentrons-dev',
  api_version: '1.2.3',
  fw_version: '4.5.6',
  system_version: '7.8.9',
  robot_model: 'OT-2 Standard',
}

export const mockLegacyServerHealthResponse = {
  name: 'opentrons-dev',
  apiServerVersion: '1.2.3',
  serialNumber: '12345',
  updateServerVersion: '1.2.3',
  smoothieVersion: '4.5.6',
  systemVersion: '7.8.9',
}

export const MOCK_DISCOVERY_ROBOTS = [
  {
    name: 'opentrons-dev',
    health: mockLegacyHealthResponse,
    serverHealth: mockLegacyServerHealthResponse,
    addresses: [
      {
        ip: '10.14.19.50',
        port: 31950,
        seen: true,
        healthStatus: HEALTH_STATUS_OK,
        serverHealthStatus: HEALTH_STATUS_OK,
        healthError: null,
        serverHealthError: null,
        advertisedModel: null,
      },
    ],
  },
  {
    name: 'opentrons-dev2',
    health: mockLegacyHealthResponse,
    serverHealth: mockLegacyServerHealthResponse,
    addresses: [
      {
        ip: '10.14.19.51',
        port: 31950,
        seen: true,
        healthStatus: HEALTH_STATUS_OK,
        serverHealthStatus: HEALTH_STATUS_OK,
        healthError: null,
        serverHealthError: null,
        advertisedModel: null,
      },
    ],
  },
  {
    name: 'opentrons-dev3',
    health: mockLegacyHealthResponse,
    serverHealth: mockLegacyServerHealthResponse,
    addresses: [
      {
        ip: '10.14.19.52',
        port: 31950,
        seen: true,
        healthStatus: HEALTH_STATUS_NOT_OK,
        serverHealthStatus: HEALTH_STATUS_NOT_OK,
        healthError: null,
        serverHealthError: null,
        advertisedModel: null,
      },
    ],
  },
  {
    name: 'opentrons-dev4',
    health: mockLegacyHealthResponse,
    serverHealth: mockLegacyServerHealthResponse,
    addresses: [
      {
        ip: '10.14.19.53',
        port: 31950,
        seen: true,
        healthStatus: HEALTH_STATUS_OK,
        serverHealthStatus: HEALTH_STATUS_OK,
        healthError: null,
        serverHealthError: null,
        advertisedModel: null,
      },
    ],
  },
]

export const MOCK_STORE_ROBOTS = [
  {
    robotName: 'opentrons-dev',
    ip: '10.14.19.50',
  },
  {
    robotName: 'opentrons-dev2',
    ip: '10.14.19.51',
  },
  {
    robotName: 'opentrons-dev3',
    ip: '10.14.19.52',
  },
  {
    robotName: 'opentrons-dev4',
    ip: '10.14.19.53',
  },
]

export const MOCK_HEALTHY_ROBOTS = [
  {
    robotName: 'opentrons-dev',
    ip: '10.14.19.50',
  },
  {
    robotName: 'opentrons-dev2',
    ip: '10.14.19.51',
  },
  {
    robotName: 'opentrons-dev4',
    ip: '10.14.19.53',
  },
]
