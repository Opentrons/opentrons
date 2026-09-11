import { describe, expect, it } from 'vitest'

import {
  mockHealthErrorStringResponse,
  mockHealthFetchErrorResponse,
  mockLegacyHealthResponse,
  mockLegacyServerHealthResponse,
  mockOT2HealthResponse,
  mockOT2ServerHealthResponse,
  mockOT3HealthResponse,
  mockOT3ServerHealthResponse,
} from '../../../../../discovery-client/src/fixtures'
import {
  CONNECTABLE,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_OK,
  HEALTH_STATUS_UNREACHABLE,
  REACHABLE,
  ROBOT_MODEL_OT2,
  ROBOT_MODEL_OT3,
  UNREACHABLE,
} from '../constants'
import * as discovery from '../selectors'

import type { State } from '../../types'

const MOCK_STATE: State = {
  config: {
    devInternal: {},
  },
  discovery: {
    robotsByName: {
      ot2Robot: {
        name: 'ot2Robot',
        health: mockOT2HealthResponse,
        serverHealth: mockOT2ServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.1',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: null,
            serverHealthError: null,
            advertisedModel: ROBOT_MODEL_OT2,
          },
        ],
      },
      // OT-3 connectable: health defined and healthStatus OK
      flexConnectable: {
        name: 'flexConnectable',
        health: mockOT3HealthResponse,
        serverHealth: mockOT3ServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.2',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: null,
            serverHealthError: null,
            advertisedModel: ROBOT_MODEL_OT3,
          },
        ],
      },
      // OT-3 reachable: healthStatus notOk (error response), but serverHealthStatus OK
      flexReachableError: {
        name: 'flexReachableError',
        health: mockOT3HealthResponse,
        serverHealth: mockOT3ServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.3',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_NOT_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: mockHealthErrorStringResponse,
            serverHealthError: null,
            advertisedModel: ROBOT_MODEL_OT3,
          },
        ],
      },
      // OT-3 reachable: recently seen but IP unreachable
      flexReachableSeen: {
        name: 'flexReachableSeen',
        health: mockOT3HealthResponse,
        serverHealth: mockOT3ServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.4',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_UNREACHABLE,
            serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
            healthError: mockHealthFetchErrorResponse,
            serverHealthError: mockHealthFetchErrorResponse,
            advertisedModel: ROBOT_MODEL_OT3,
          },
        ],
      },
      // OT-3 unreachable: IP unreachable and not seen recently
      flexUnreachable: {
        name: 'flexUnreachable',
        health: mockOT3HealthResponse,
        serverHealth: mockOT3ServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.5',
            port: 31950,
            seen: false,
            healthStatus: HEALTH_STATUS_UNREACHABLE,
            serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
            healthError: mockHealthFetchErrorResponse,
            serverHealthError: mockHealthFetchErrorResponse,
            advertisedModel: ROBOT_MODEL_OT3,
          },
        ],
      },
      // OT-3 unreachable: no IP addresses
      flexNoAddress: {
        name: 'flexNoAddress',
        health: mockOT3HealthResponse,
        serverHealth: mockOT3ServerHealthResponse,
        addresses: [],
        advertisedModel: ROBOT_MODEL_OT3,
      },
    },
  },
} as any

// flexConnectable is connectable because health is defined and healthStatus is "ok"
const EXPECTED_FLEX_CONNECTABLE = {
  name: 'flexConnectable',
  status: CONNECTABLE,
  local: false,
  seen: true,
  health: mockOT3HealthResponse,
  serverHealth: mockOT3ServerHealthResponse,
  healthStatus: HEALTH_STATUS_OK,
  serverHealthStatus: HEALTH_STATUS_OK,
  ip: '10.0.0.2',
  port: 31950,
  robotModel: ROBOT_MODEL_OT3,
}

// flexReachableError is reachable because healthStatus is "notOk" (responded with error)
const EXPECTED_FLEX_REACHABLE_ERROR = {
  name: 'flexReachableError',
  status: REACHABLE,
  local: false,
  seen: true,
  health: mockOT3HealthResponse,
  serverHealth: mockOT3ServerHealthResponse,
  healthStatus: HEALTH_STATUS_NOT_OK,
  serverHealthStatus: HEALTH_STATUS_OK,
  ip: '10.0.0.3',
  port: 31950,
  robotModel: ROBOT_MODEL_OT3,
}

// flexReachableSeen is reachable because it was recently seen, even though IP is unreachable
const EXPECTED_FLEX_REACHABLE_SEEN = {
  name: 'flexReachableSeen',
  status: REACHABLE,
  local: false,
  seen: true,
  health: mockOT3HealthResponse,
  serverHealth: mockOT3ServerHealthResponse,
  healthStatus: HEALTH_STATUS_UNREACHABLE,
  serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
  ip: '10.0.0.4',
  port: 31950,
  robotModel: ROBOT_MODEL_OT3,
}

// flexUnreachable is unreachable because IP is unreachable and not seen recently
const EXPECTED_FLEX_UNREACHABLE = {
  name: 'flexUnreachable',
  status: UNREACHABLE,
  local: false,
  seen: false,
  health: mockOT3HealthResponse,
  serverHealth: mockOT3ServerHealthResponse,
  healthStatus: HEALTH_STATUS_UNREACHABLE,
  serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
  ip: '10.0.0.5',
  port: 31950,
  robotModel: ROBOT_MODEL_OT3,
}

// flexNoAddress is unreachable because we don't have any IP addresses for it
const EXPECTED_FLEX_NO_ADDRESS = {
  name: 'flexNoAddress',
  status: UNREACHABLE,
  local: null,
  seen: false,
  health: mockOT3HealthResponse,
  serverHealth: mockOT3ServerHealthResponse,
  healthStatus: null,
  serverHealthStatus: null,
  ip: null,
  port: null,
  advertisedModel: ROBOT_MODEL_OT3,
  robotModel: ROBOT_MODEL_OT3,
}

describe('discovery selectors', () => {
  const SPECS: Array<{
    name: string
    selector: (...args: any[]) => any
    args?: any[]
    state: any
    expected: unknown
  }> = [
    {
      name: 'getScanning when true',
      selector: discovery.getScanning,
      state: { discovery: { scanning: true } },
      expected: true,
    },
    {
      name: 'getScanning when false',
      selector: discovery.getScanning,
      state: { discovery: { scanning: false } },
      expected: false,
    },
    {
      name: 'getDiscoveredRobots assigns status based on healthStatus and serverHealthStatus',
      selector: discovery.getDiscoveredRobots,
      state: MOCK_STATE,
      expected: [
        EXPECTED_FLEX_CONNECTABLE,
        EXPECTED_FLEX_REACHABLE_ERROR,
        EXPECTED_FLEX_REACHABLE_SEEN,
        EXPECTED_FLEX_UNREACHABLE,
        EXPECTED_FLEX_NO_ADDRESS,
      ],
    },
    {
      name: 'getDiscoveredRobots filters out OT-2 robots',
      selector: discovery.getDiscoveredRobots,
      state: MOCK_STATE,
      expected: expect.not.arrayContaining([
        expect.objectContaining({ name: 'ot2Robot' }),
      ]),
    },
    {
      name: 'getConnectableRobots grabs robots with connectable status',
      selector: discovery.getConnectableRobots,
      state: MOCK_STATE,
      expected: [EXPECTED_FLEX_CONNECTABLE],
    },
    {
      name: 'getReachableRobots grabs robots with reachable status',
      selector: discovery.getReachableRobots,
      state: MOCK_STATE,
      expected: [EXPECTED_FLEX_REACHABLE_ERROR, EXPECTED_FLEX_REACHABLE_SEEN],
    },
    {
      name: 'getUnreachableRobots grabs robots with unreachable status',
      selector: discovery.getUnreachableRobots,
      state: MOCK_STATE,
      expected: [EXPECTED_FLEX_NO_ADDRESS, EXPECTED_FLEX_UNREACHABLE],
    },
    {
      name: 'display name removes opentrons- from connectable robot names',
      selector: discovery.getDiscoveredRobots,
      state: {
        config: { devInternal: {} },
        discovery: {
          robotsByName: {
            'opentrons-foo': {
              name: 'opentrons-foo',
              health: mockOT3HealthResponse,
              serverHealth: mockOT3ServerHealthResponse,
              addresses: [],
            },
          },
        },
        robot: { connection: { connectedTo: '' } },
      },
      expected: [expect.objectContaining({ name: 'opentrons-foo' })],
    },
    {
      name: 'handles legacy IPv6 robots by wrapping IP in [] and setting as local',
      selector: discovery.getDiscoveredRobots,
      state: {
        config: { devInternal: {} },
        discovery: {
          robotsByName: {
            'opentrons-foo': {
              name: 'opentrons-foo',
              health: mockOT3HealthResponse,
              serverHealth: mockOT3ServerHealthResponse,
              addresses: [
                {
                  ip: 'fd00:0:cafe:fefe::1',
                  port: 31950,
                  seen: true,
                  healthStatus: HEALTH_STATUS_OK,
                  serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
                  healthError: null,
                  serverHealthError: mockHealthFetchErrorResponse,
                  advertisedModel: null,
                },
              ],
            },
          },
        },
        robot: { connection: { connectedTo: '' } },
      },
      expected: [
        expect.objectContaining({
          name: 'opentrons-foo',
          ip: '[fd00:0:cafe:fefe::1]',
          local: true,
        }),
      ],
    },
    {
      name: 'handles opentrons-usb robots by setting as local',
      selector: discovery.getDiscoveredRobots,
      state: {
        config: { devInternal: {} },
        discovery: {
          robotsByName: {
            'opentrons-foo': {
              name: 'opentrons-foo',
              health: mockOT3HealthResponse,
              serverHealth: mockOT3ServerHealthResponse,
              addresses: [
                {
                  ip: 'opentrons-usb',
                  port: 31950,
                  seen: true,
                  healthStatus: HEALTH_STATUS_OK,
                  serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
                  healthError: null,
                  serverHealthError: mockHealthFetchErrorResponse,
                  advertisedModel: null,
                },
              ],
            },
          },
        },
        robot: { connection: { connectedTo: '' } },
      },
      expected: [
        expect.objectContaining({
          name: 'opentrons-foo',
          ip: 'opentrons-usb',
          local: true,
        }),
      ],
    },
    {
      name: 'getViewableRobots returns connectable and reachable robots',
      selector: discovery.getViewableRobots,
      state: MOCK_STATE,
      expected: [
        EXPECTED_FLEX_CONNECTABLE,
        EXPECTED_FLEX_REACHABLE_ERROR,
        EXPECTED_FLEX_REACHABLE_SEEN,
      ],
    },
    {
      name: 'getRobotApiVersion returns health.apiServerVersion',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: {
        serverHealth: { apiServerVersion: '1.2.3' },
        health: { api_version: '4.5.6' },
      },
      selector: discovery.getRobotApiVersion,
      expected: '4.5.6',
    },
    {
      name: 'getRobotApiVersion returns serverHealth.api_version if no health',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: {
        serverHealth: { apiServerVersion: '4.5.6' },
        health: null,
      },
      selector: discovery.getRobotApiVersion,
      expected: '4.5.6',
    },
    {
      name: 'getRobotApiVersion returns null if no healths',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: { serverHealth: null, health: null },
      selector: discovery.getRobotApiVersion,
      expected: null,
    },
    {
      name: 'getRobotApiVersion returns serverHealth if API health invalid',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: {
        serverHealth: { apiServerVersion: '4.5.6' },
        health: { api_version: 'not available' },
      },
      selector: discovery.getRobotApiVersion,
      expected: '4.5.6',
    },
    {
      name: 'getRobotApiVersion returns null if all healths invalid',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: {
        serverHealth: { apiServerVersion: 'not available' },
        health: { api_version: 'also not available' },
      },
      selector: discovery.getRobotApiVersion,
      expected: null,
    },
    {
      name: 'getRobotFirmwareVersion returns health.smoothieVersion',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: {
        serverHealth: { smoothieVersion: '1.2.3' },
        health: { fw_version: '4.5.6' },
      },
      selector: discovery.getRobotFirmwareVersion,
      expected: '4.5.6',
    },
    {
      name: 'getRobotFirmwareVersion returns serverHealth.smoothieVersion if no health',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: { serverHealth: { smoothieVersion: '4.5.6' }, health: null },
      selector: discovery.getRobotFirmwareVersion,
      expected: '4.5.6',
    },
    {
      name: 'getRobotFirmwareVersion returns null if no healths',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: { serverHealth: null, health: null },
      selector: discovery.getRobotFirmwareVersion,
      expected: null,
    },
    {
      name: 'getRobotProtocolApiVersion returns first health.protocol_api_version',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: {
        serverHealth: {},
        health: { protocol_api_version: [2, 1] },
      },
      selector: discovery.getRobotProtocolApiVersion,
      expected: { min: '1.0', max: '2.1' },
    },
    {
      name: 'getRobotProtocolApiVersion returns minimum and maximum protocol versions',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: {
        serverHealth: {},
        health: {
          minimum_protocol_api_version: [2, 0],
          maximum_protocol_api_version: [2, 8],
        },
      },
      selector: discovery.getRobotProtocolApiVersion,
      expected: { min: '2.0', max: '2.8' },
    },
    {
      name: 'getRobotProtocolApiVersion returns default protocol versions when none exists',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: {
        serverHealth: {},
        health: {},
      },
      selector: discovery.getRobotProtocolApiVersion,
      expected: { min: '1.0', max: '1.0' },
    },
    {
      name: 'getRobotProtocolApiVersion returns null if no health exists',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: { serverHealth: null, health: null },
      selector: discovery.getRobotProtocolApiVersion,
      expected: null,
    },
    {
      name: 'getRobotByName returns connectable robot by name',
      selector: discovery.getRobotByName,
      state: MOCK_STATE,
      args: ['flexConnectable'],
      expected: EXPECTED_FLEX_CONNECTABLE,
    },
    {
      name: 'getRobotByName returns reachable robot by name',
      selector: discovery.getRobotByName,
      state: MOCK_STATE,
      args: ['flexReachableSeen'],
      expected: EXPECTED_FLEX_REACHABLE_SEEN,
    },
    {
      name: 'getRobotByName returns null if robot is not viewable',
      selector: discovery.getRobotByName,
      state: MOCK_STATE,
      args: ['flexUnreachable'],
      expected: null,
    },
    {
      name: 'getDiscoverableRobotByName returns connectable robot by name',
      selector: discovery.getDiscoverableRobotByName,
      state: MOCK_STATE,
      args: ['flexConnectable'],
      expected: EXPECTED_FLEX_CONNECTABLE,
    },
    {
      name: 'getDiscoverableRobotByName returns reachable robot by name',
      selector: discovery.getDiscoverableRobotByName,
      state: MOCK_STATE,
      args: ['flexReachableSeen'],
      expected: EXPECTED_FLEX_REACHABLE_SEEN,
    },
    {
      name: 'getDiscoverableRobotByName returns unreachable robot by name',
      selector: discovery.getDiscoverableRobotByName,
      state: MOCK_STATE,
      args: ['flexUnreachable'],
      expected: EXPECTED_FLEX_UNREACHABLE,
    },
    {
      name: 'getDiscoverableRobotByName returns null for filtered OT-2 robot',
      selector: discovery.getDiscoverableRobotByName,
      state: MOCK_STATE,
      args: ['ot2Robot'],
      expected: null,
    },
    {
      name: 'getRobotApiVersionByName returns API version of connectable robot',
      selector: discovery.getRobotApiVersionByName,
      state: MOCK_STATE,
      args: ['flexConnectable'],
      expected: EXPECTED_FLEX_CONNECTABLE.health.api_version,
    },
    {
      name: 'getRobotApiVersionByName returns API version of reachable robot',
      selector: discovery.getRobotApiVersionByName,
      state: MOCK_STATE,
      args: ['flexReachableSeen'],
      expected: EXPECTED_FLEX_REACHABLE_SEEN.health.api_version,
    },
    {
      name: 'getRobotType returns type of a connectable OT-3',
      selector: discovery.getRobotModelByName,
      state: MOCK_STATE,
      args: ['flexConnectable'],
      expected: 'Opentrons Flex',
    },
    {
      name: 'getRobotType returns type of a reachable OT-3',
      selector: discovery.getRobotModelByName,
      state: MOCK_STATE,
      args: ['flexReachableSeen'],
      expected: 'Opentrons Flex',
    },
    {
      name: 'getRobotType returns type of an unreachable OT-3',
      selector: discovery.getRobotModelByName,
      state: MOCK_STATE,
      args: ['flexUnreachable'],
      expected: 'Opentrons Flex',
    },
    {
      name: 'getRobotType returns null for filtered OT-2 robot',
      selector: discovery.getRobotModelByName,
      state: MOCK_STATE,
      args: ['ot2Robot'],
      expected: null,
    },
    {
      name: 'getRobotAddressesByName returns addresses by name',
      selector: discovery.getRobotAddressesByName,
      state: MOCK_STATE,
      args: ['flexReachableSeen'],
      expected: [
        {
          ip: '10.0.0.4',
          port: 31950,
          seen: true,
          healthStatus: HEALTH_STATUS_UNREACHABLE,
          serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
          healthError: mockHealthFetchErrorResponse,
          serverHealthError: mockHealthFetchErrorResponse,
          advertisedModel: ROBOT_MODEL_OT3,
        },
      ],
    },
    {
      name: 'getRobotAddressesByName returns empty array for robot with no addresses',
      selector: discovery.getRobotAddressesByName,
      state: MOCK_STATE,
      args: ['flexNoAddress'],
      expected: [],
    },
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec
    it(name, () => expect(selector(state as State, ...args)).toEqual(expected))
  })
})

describe('getRobotSerialNumber', () => {
  const SPECS: Array<{ name: string; robot: any; expected: string | null }> = [
    {
      name: 'returns health serial on flex',
      robot: MOCK_STATE.discovery.robotsByName.flexConnectable,
      expected: 'this is a flex serial',
    },
    {
      name: 'getRobotSerial returns health serial on ot2 if available',
      robot: MOCK_STATE.discovery.robotsByName.ot2Robot,
      expected: 'this is an ot2 serial',
    },
    {
      name: 'getRobotSerial falls back to update server if necessary',
      robot: {
        name: 'fallbackRobot',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
        addresses: [],
      },
      expected: '12345',
    },
  ]
  SPECS.forEach(spec => {
    it(spec.name, () => {
      expect(discovery.getRobotSerialNumber(spec.robot as any)).toEqual(
        spec.expected
      )
    })
  })
})
