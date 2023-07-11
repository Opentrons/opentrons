// discovery selectors tests
import {
  mockLegacyHealthResponse,
  mockLegacyServerHealthResponse,
  mockOT2HealthResponse,
  mockOT2ServerHealthResponse,
  mockOT3HealthResponse,
  mockOT3ServerHealthResponse,
  mockHealthErrorStringResponse,
  mockHealthFetchErrorResponse,
} from '@opentrons/discovery-client/src/__fixtures__'

import {
  HEALTH_STATUS_OK,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_UNREACHABLE,
  CONNECTABLE,
  REACHABLE,
  UNREACHABLE,
  ROBOT_MODEL_OT2,
  ROBOT_MODEL_OT3,
} from '../constants'

import * as discovery from '../selectors'

import type { State } from '../../types'

const MOCK_STATE: State = {
  discovery: {
    robotsByName: {
      foo: {
        name: 'foo',
        health: mockLegacyHealthResponse,
        serverHealth: null,
        addresses: [
          {
            ip: '10.0.0.1',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_OK,
            serverHealthStatus: HEALTH_STATUS_NOT_OK,
            healthError: null,
            serverHealthError: mockHealthErrorStringResponse,
            advertisedModel: null,
          },
        ],
      },
      bar: {
        name: 'bar',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.2',
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
      baz: {
        name: 'baz',
        health: mockOT2HealthResponse,
        serverHealth: mockOT2ServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.3',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_NOT_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: mockHealthErrorStringResponse,
            serverHealthError: null,
            advertisedModel: ROBOT_MODEL_OT2,
          },
        ],
      },
      qux: {
        name: 'qux',
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
      fizz: {
        name: 'fizz',
        health: mockOT2HealthResponse,
        serverHealth: mockOT2ServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.5',
            port: 31950,
            seen: false,
            healthStatus: HEALTH_STATUS_UNREACHABLE,
            serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
            healthError: mockHealthFetchErrorResponse,
            serverHealthError: mockHealthFetchErrorResponse,
            advertisedModel: ROBOT_MODEL_OT2,
          },
        ],
      },
      buzz: {
        name: 'buzz',
        health: mockOT2HealthResponse,
        serverHealth: mockOT2ServerHealthResponse,
        addresses: [],
        advertisedModel: ROBOT_MODEL_OT2,
      },
      fizzbuzz: {
        name: 'fizzbuzz',
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
    },
  },
} as any

// foo is connectable because health is defined and healthStatus of primary
// address is "ok". These are all saying it's an OT-2, so it's an OT-2
const EXPECTED_FOO = {
  name: 'foo',
  displayName: 'foo',
  status: CONNECTABLE,
  local: false,
  seen: true,
  health: mockLegacyHealthResponse,
  serverHealth: null,
  healthStatus: HEALTH_STATUS_OK,
  serverHealthStatus: HEALTH_STATUS_NOT_OK,
  ip: '10.0.0.1',
  port: 31950,
  robotModel: ROBOT_MODEL_OT2,
}

// bar is connectable because health is defined and healthStatus of primary
// address is "ok"
const EXPECTED_BAR = {
  name: 'bar',
  displayName: 'bar',
  status: CONNECTABLE,
  local: false,
  seen: true,
  health: mockLegacyHealthResponse,
  serverHealth: mockLegacyServerHealthResponse,
  healthStatus: HEALTH_STATUS_OK,
  serverHealthStatus: HEALTH_STATUS_OK,
  ip: '10.0.0.2',
  port: 31950,
  robotModel: ROBOT_MODEL_OT2,
}

// baz is reachable because healthStatus is "notOk", which means it responded
// with an error code. The cached health values still indicate that it's an
// OT-2.
const EXPECTED_BAZ = {
  name: 'baz',
  displayName: 'baz',
  status: REACHABLE,
  local: false,
  seen: true,
  health: mockOT2HealthResponse,
  serverHealth: mockOT2ServerHealthResponse,
  healthStatus: HEALTH_STATUS_NOT_OK,
  serverHealthStatus: HEALTH_STATUS_OK,
  ip: '10.0.0.3',
  port: 31950,
  robotModel: ROBOT_MODEL_OT2,
}

// qux is reachable because it was recently seen, even though primary IP is
// not currently responding in any way. Cached health responses have no model
// data, but the MDNS data says it's an OT-3.
const EXPECTED_QUX = {
  name: 'qux',
  displayName: 'qux',
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

// fizz is unreachable because IP is unreachable and we haven't seen any of
// this robot's IP addresses recently. Cached health responses indicate it's
// an OT-2.
const EXPECTED_FIZZ = {
  name: 'fizz',
  displayName: 'fizz',
  status: UNREACHABLE,
  local: false,
  seen: false,
  health: mockOT2HealthResponse,
  serverHealth: mockOT2ServerHealthResponse,
  healthStatus: HEALTH_STATUS_UNREACHABLE,
  serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
  ip: '10.0.0.5',
  port: 31950,
  robotModel: ROBOT_MODEL_OT2,
}

// buzz is unreachable because we don't have any IP addresses for it
const EXPECTED_BUZZ = {
  name: 'buzz',
  displayName: 'buzz',
  status: UNREACHABLE,
  local: null,
  seen: false,
  health: mockOT2HealthResponse,
  serverHealth: mockOT2ServerHealthResponse,
  healthStatus: null,
  serverHealthStatus: null,
  ip: null,
  port: null,
  advertisedModel: ROBOT_MODEL_OT2,
  robotModel: ROBOT_MODEL_OT2,
}

// fizzbuzz is as foo and therefore connectable, but is an OT-3
const EXPECTED_FIZZBUZZ = {
  name: 'fizzbuzz',
  displayName: 'fizzbuzz',
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
      name:
        'getDiscoveredRobots assigns status based on healthStatus and serverHealthStatus',
      selector: discovery.getDiscoveredRobots,
      state: MOCK_STATE,
      expected: [
        EXPECTED_FOO,
        EXPECTED_BAR,
        EXPECTED_BAZ,
        EXPECTED_QUX,
        EXPECTED_FIZZ,
        EXPECTED_BUZZ,
        EXPECTED_FIZZBUZZ,
      ],
    },
    {
      name: 'getConnectableRobots grabs robots with connectable status',
      selector: discovery.getConnectableRobots,
      state: MOCK_STATE,
      expected: [EXPECTED_FOO, EXPECTED_BAR, EXPECTED_FIZZBUZZ],
    },
    {
      name: 'getReachableRobots grabs robots with reachable status',
      selector: discovery.getReachableRobots,
      state: MOCK_STATE,
      expected: [EXPECTED_BAZ, EXPECTED_QUX],
    },
    {
      name: 'getUnreachableRobots grabs robots with unreachable status',
      selector: discovery.getUnreachableRobots,
      state: MOCK_STATE,
      expected: [EXPECTED_FIZZ, EXPECTED_BUZZ],
    },
    {
      name: 'display name removes opentrons- from connectable robot names',
      selector: discovery.getDiscoveredRobots,
      state: {
        discovery: {
          robotsByName: {
            'opentrons-foo': {
              name: 'opentrons-foo',
              health: mockOT2HealthResponse,
              serverHealth: mockOT2ServerHealthResponse,
              addresses: [],
            },
          },
        },
        robot: { connection: { connectedTo: '' } },
      },
      expected: [
        expect.objectContaining({ name: 'opentrons-foo', displayName: 'foo' }),
      ],
    },
    {
      name:
        'handles legacy IPv6 robots by wrapping IP in [] and setting as local',
      selector: discovery.getDiscoveredRobots,
      state: {
        discovery: {
          robotsByName: {
            'opentrons-foo': {
              name: 'opentrons-foo',
              health: mockLegacyHealthResponse,
              serverHealth: mockLegacyServerHealthResponse,
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
        discovery: {
          robotsByName: {
            'opentrons-foo': {
              name: 'opentrons-foo',
              health: mockLegacyHealthResponse,
              serverHealth: mockLegacyServerHealthResponse,
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
        EXPECTED_FOO,
        EXPECTED_BAR,
        EXPECTED_FIZZBUZZ,
        EXPECTED_BAZ,
        EXPECTED_QUX,
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
      name:
        'getRobotFirmwareVersion returns serverHealth.smoothieVersion if no health',
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
      name:
        'getRobotProtocolApiVersion returns first health.protocol_api_version',
      // TODO(mc, 2018-10-11): state is a misnomer here, maybe rename it "input"
      state: {
        serverHealth: {},
        health: { protocol_api_version: [2, 1] },
      },
      selector: discovery.getRobotProtocolApiVersion,
      expected: { min: '1.0', max: '2.1' },
    },
    {
      name:
        'getRobotProtocolApiVersion returns minimum and maximum protocol versions',
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
      name:
        'getRobotProtocolApiVersion returns default protocol versions when none exists',
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
      args: ['foo'],
      expected: EXPECTED_FOO,
    },
    {
      name: 'getRobotByName returns reachable robot by name',
      selector: discovery.getRobotByName,
      state: MOCK_STATE,
      args: ['baz'],
      expected: EXPECTED_BAZ,
    },
    {
      name: 'getRobotByName returns null if robot is not connectable',
      selector: discovery.getRobotByName,
      state: MOCK_STATE,
      args: ['fizz'],
      expected: null,
    },
    {
      name: 'getDiscoverableRobotByName returns connectable robot by name',
      selector: discovery.getDiscoverableRobotByName,
      state: MOCK_STATE,
      args: ['foo'],
      expected: EXPECTED_FOO,
    },
    {
      name: 'getDiscoverableRobotByName returns reachable robot by name',
      selector: discovery.getDiscoverableRobotByName,
      state: MOCK_STATE,
      args: ['baz'],
      expected: EXPECTED_BAZ,
    },
    {
      name:
        'getDiscoverableRobotByName returns discoverable robot by name if robot is not connectable',
      selector: discovery.getDiscoverableRobotByName,
      state: MOCK_STATE,
      args: ['fizz'],
      expected: EXPECTED_FIZZ,
    },
    {
      name: 'getRobotApiVersionByName returns API version of connectable robot',
      selector: discovery.getRobotApiVersionByName,
      state: MOCK_STATE,
      args: ['foo'],
      expected: EXPECTED_FOO.health.api_version,
    },
    {
      name: 'getRobotApiVersionByName returns API version of reachable robot',
      selector: discovery.getRobotApiVersionByName,
      state: MOCK_STATE,
      args: ['baz'],
      expected: EXPECTED_BAZ.health.api_version,
    },
    {
      name: 'getRobotType returns type of a connectable OT-3',
      selector: discovery.getRobotModelByName,
      state: MOCK_STATE,
      args: ['fizzbuzz'],
      expected: 'Opentrons Flex',
    },
    {
      name: 'getRobotType returns type of a connectable OT-2',
      selector: discovery.getRobotModelByName,
      state: MOCK_STATE,
      args: ['foo'],
      expected: 'OT-2',
    },
    {
      name: 'getRobotType returns OT-2 for a reachable but cached robot',
      selector: discovery.getRobotModelByName,
      state: MOCK_STATE,
      args: ['baz'],
      expected: 'OT-2',
    },
    {
      name: 'getRobotType returns OT-2 by default for an unreachable robot',
      selector: discovery.getRobotModelByName,
      state: MOCK_STATE,
      args: ['qux'],
      expected: 'Opentrons Flex',
    },
    {
      name: 'getRobotAddressesByName returns addresses by name',
      selector: discovery.getRobotAddressesByName,
      state: MOCK_STATE,
      args: ['qux'],
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
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec
    it(name, () => expect(selector(state as State, ...args)).toEqual(expected))
  })
})
