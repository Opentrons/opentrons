// discovery selectors tests
import {
  mockHealthResponse,
  mockServerHealthResponse,
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
} from '../constants'

import * as discovery from '../selectors'

const MOCK_STATE = {
  robot: { connection: { connectedTo: 'bar' } },
  discovery: {
    robotsByName: {
      foo: {
        name: 'foo',
        health: mockHealthResponse,
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
          },
        ],
      },
      bar: {
        name: 'bar',
        health: mockHealthResponse,
        serverHealth: mockServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.2',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: null,
            serverHealthError: null,
          },
        ],
      },
      baz: {
        name: 'baz',
        health: mockHealthResponse,
        serverHealth: mockServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.3',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_NOT_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: mockHealthErrorStringResponse,
            serverHealthError: null,
          },
        ],
      },
      qux: {
        name: 'qux',
        health: mockHealthResponse,
        serverHealth: mockServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.4',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_UNREACHABLE,
            serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
            healthError: mockHealthFetchErrorResponse,
            serverHealthError: mockHealthFetchErrorResponse,
          },
        ],
      },
      fizz: {
        name: 'fizz',
        health: mockHealthResponse,
        serverHealth: mockServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.5',
            port: 31950,
            seen: false,
            healthStatus: HEALTH_STATUS_UNREACHABLE,
            serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
            healthError: mockHealthFetchErrorResponse,
            serverHealthError: mockHealthFetchErrorResponse,
          },
        ],
      },
      buzz: {
        name: 'buzz',
        health: mockHealthResponse,
        serverHealth: mockServerHealthResponse,
        addresses: [],
      },
    },
  },
}

// foo is connectable because health is defined and healthStatus of primary
// address is "ok"
const EXPECTED_FOO = {
  name: 'foo',
  displayName: 'foo',
  status: CONNECTABLE,
  connected: false,
  local: false,
  seen: true,
  health: mockHealthResponse,
  serverHealth: null,
  healthStatus: HEALTH_STATUS_OK,
  serverHealthStatus: HEALTH_STATUS_NOT_OK,
  ip: '10.0.0.1',
  port: 31950,
}

// bar is connectable because health is defined and healthStatus of primary
// address is "ok", and bar is connected because of connectedTo state
const EXPECTED_BAR = {
  name: 'bar',
  displayName: 'bar',
  status: CONNECTABLE,
  connected: true,
  local: false,
  seen: true,
  health: mockHealthResponse,
  serverHealth: mockServerHealthResponse,
  healthStatus: HEALTH_STATUS_OK,
  serverHealthStatus: HEALTH_STATUS_OK,
  ip: '10.0.0.2',
  port: 31950,
}

// baz is reachable because healthStatus is "notOk", which means it responded
// with an error code
const EXPECTED_BAZ = {
  name: 'baz',
  displayName: 'baz',
  status: REACHABLE,
  connected: false,
  local: false,
  seen: true,
  health: mockHealthResponse,
  serverHealth: mockServerHealthResponse,
  healthStatus: HEALTH_STATUS_NOT_OK,
  serverHealthStatus: HEALTH_STATUS_OK,
  ip: '10.0.0.3',
  port: 31950,
}

// qux is reachable because it was recently seen, even though primary IP is
// not currently responding in any way
const EXPECTED_QUX = {
  name: 'qux',
  displayName: 'qux',
  status: REACHABLE,
  connected: false,
  local: false,
  seen: true,
  health: mockHealthResponse,
  serverHealth: mockServerHealthResponse,
  healthStatus: HEALTH_STATUS_UNREACHABLE,
  serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
  ip: '10.0.0.4',
  port: 31950,
}

// fizz is unreachable because IP is unreachable and we haven't seen any of
// this robot's IP addresses recently
const EXPECTED_FIZZ = {
  name: 'fizz',
  displayName: 'fizz',
  status: UNREACHABLE,
  connected: false,
  local: false,
  seen: false,
  health: mockHealthResponse,
  serverHealth: mockServerHealthResponse,
  healthStatus: HEALTH_STATUS_UNREACHABLE,
  serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
  ip: '10.0.0.5',
  port: 31950,
}

// buzz is unreachable because we don't have any IP addresses for it
const EXPECTED_BUZZ = {
  name: 'buzz',
  displayName: 'buzz',
  status: UNREACHABLE,
  connected: false,
  local: null,
  seen: false,
  health: mockHealthResponse,
  serverHealth: mockServerHealthResponse,
  healthStatus: null,
  serverHealthStatus: null,
  ip: null,
  port: null,
}

describe('discovery selectors', () => {
  const SPECS = [
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
      ],
    },
    {
      name: 'getConnectableRobots grabs robots with connectable status',
      selector: discovery.getConnectableRobots,
      state: MOCK_STATE,
      expected: [EXPECTED_FOO, EXPECTED_BAR],
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
              health: mockHealthResponse,
              serverHealth: mockServerHealthResponse,
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
              health: mockHealthResponse,
              serverHealth: mockServerHealthResponse,
              addresses: [
                {
                  ip: 'fd00:0:cafe:fefe::1',
                  port: 31950,
                  seen: true,
                  healthStatus: HEALTH_STATUS_OK,
                  serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
                  healthError: null,
                  serverHealthError: mockHealthFetchErrorResponse,
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
      name: 'getViewableRobots returns connectable and reachable robots',
      selector: discovery.getViewableRobots,
      state: MOCK_STATE,
      expected: [EXPECTED_FOO, EXPECTED_BAR, EXPECTED_BAZ, EXPECTED_QUX],
    },
    {
      name: 'getConnectedRobot returns connected robot if connectable',
      selector: discovery.getConnectedRobot,
      state: MOCK_STATE,
      expected: EXPECTED_BAR,
    },
    {
      name: 'getConnectedRobot returns null if not connectable',
      selector: discovery.getConnectedRobot,
      state: { ...MOCK_STATE, robot: { connection: { connectedTo: 'fizz' } } },
      expected: null,
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
        health: { protocol_api_version: [2, 0] },
      },
      selector: discovery.getRobotProtocolApiVersion,
      expected: '2.0',
    },
    {
      name: 'getRobotProtocolApiVersion returns null if no healths',
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
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec
    it(name, () => expect(selector(state, ...args)).toEqual(expected))
  })
})
