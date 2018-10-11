// discovery selectors tests
import * as discovery from '..'

const makeFullyUp = (
  name,
  ip,
  status = null,
  connected = null,
  displayName = null
) => ({
  name,
  ip,
  local: false,
  ok: true,
  serverOk: true,
  advertising: true,
  health: {},
  serverHealth: {},
  status,
  connected,
  displayName,
})

const makeConnectable = (
  name,
  ip,
  status = null,
  connected = null,
  displayName = null
) => ({
  name,
  ip,
  local: false,
  ok: true,
  serverOk: false,
  health: {},
  status,
  connected,
  displayName,
})

const makeAdvertising = (name, ip, status = null, displayName = null) => ({
  name,
  ip,
  local: false,
  ok: false,
  serverOk: false,
  advertising: true,
  status,
  displayName,
})

const makeServerUp = (
  name,
  ip,
  advertising,
  status = null,
  displayName = null
) => ({
  name,
  ip,
  advertising,
  local: false,
  ok: false,
  serverOk: true,
  serverHealth: {},
  status,
  displayName,
})

const makeUnreachable = (name, ip, status = null, displayName = null) => ({
  name,
  ip,
  local: false,
  ok: false,
  serverOk: false,
  advertising: false,
  status,
  displayName,
})

describe('discovery selectors', () => {
  const SPECS = [
    {
      name: 'getScanning when true',
      selector: discovery.getScanning,
      state: {discovery: {scanning: true}},
      expected: true,
    },
    {
      name: 'getScanning when false',
      selector: discovery.getScanning,
      state: {discovery: {scanning: false}},
      expected: false,
    },
    {
      name: 'getConnectableRobots grabs robots with ok: true and health',
      selector: discovery.getConnectableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [makeConnectable('foo', '10.0.0.1')],
            bar: [makeFullyUp('bar', '10.0.0.2')],
          },
        },
        robot: {connection: {connectedTo: 'bar'}},
      },
      expected: [
        makeConnectable('foo', '10.0.0.1', 'connectable', false, 'foo'),
        makeFullyUp('bar', '10.0.0.2', 'connectable', true, 'bar'),
      ],
    },
    {
      name: 'getConnectableRobots grabs correct service',
      selector: discovery.getConnectableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [
              makeConnectable('foo', '10.0.0.1'),
              makeConnectable('foo', '10.0.0.2'),
              makeServerUp('foo', '10.0.0.3', false),
              makeAdvertising('foo', '10.0.0.4', false),
            ],
          },
        },
        robot: {connection: {connectedTo: 'foo'}},
      },
      expected: [
        makeConnectable('foo', '10.0.0.1', 'connectable', true, 'foo'),
      ],
    },
    {
      name: 'getReachableRobots grabs robots with serverUp or advertising',
      selector: discovery.getReachableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [makeServerUp('foo', '10.0.0.1', false)],
            bar: [makeAdvertising('bar', '10.0.0.2')],
          },
        },
      },
      expected: [
        makeServerUp('foo', '10.0.0.1', false, 'reachable', 'foo'),
        makeAdvertising('bar', '10.0.0.2', 'reachable', 'bar'),
      ],
    },
    {
      name: 'getReachableRobots grabs correct service',
      selector: discovery.getReachableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [
              makeServerUp('foo', '10.0.0.1', true),
              makeServerUp('foo', '10.0.0.1', false),
              makeAdvertising('foo', '10.0.0.2'),
            ],
          },
        },
      },
      expected: [makeServerUp('foo', '10.0.0.1', true, 'reachable', 'foo')],
    },
    {
      name: 'getReachableRobots does not grab connectable robots',
      selector: discovery.getReachableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [
              makeConnectable('foo', '10.0.0.1'),
              makeServerUp('foo', '10.0.0.2', true),
            ],
            bar: [
              makeConnectable('bar', '10.0.0.3'),
              makeServerUp('bar', '10.0.0.4', false),
            ],
            baz: [
              makeConnectable('baz', '10.0.0.5'),
              makeAdvertising('baz', '10.0.0.6'),
            ],
            qux: [makeFullyUp('qux', '10.0.0.7')],
          },
        },
      },
      expected: [],
    },
    {
      name: 'getUnreachableRobots grabs robots with no ip',
      selector: discovery.getUnreachableRobots,
      state: {
        discovery: {
          robotsByName: {foo: [{name: 'foo', ip: null}]},
        },
      },
      expected: [
        {name: 'foo', ip: null, status: 'unreachable', displayName: 'foo'},
      ],
    },
    {
      name: 'getUnreachableRobots grabs robots with IP but no responses',
      selector: discovery.getUnreachableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [
              makeUnreachable('foo', '10.0.0.1'),
              makeUnreachable('foo', '10.0.0.2'),
            ],
          },
        },
      },
      expected: [makeUnreachable('foo', '10.0.0.1', 'unreachable', 'foo')],
    },
    {
      name: "getUnreachableRobots won't grab connectable/reachable robots",
      selector: discovery.getUnreachableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [
              makeServerUp('foo', '10.0.0.1', true),
              makeUnreachable('foo', '10.0.0.2'),
            ],
            bar: [
              makeServerUp('bar', '10.0.0.3', false),
              makeUnreachable('bar', '10.0.0.4'),
            ],
            baz: [
              makeAdvertising('bar', '10.0.0.5'),
              makeUnreachable('baz', '10.0.0.6'),
            ],
            qux: [makeConnectable('qux', '10.0.0.7')],
          },
        },
      },
      expected: [],
    },
    {
      name: 'display name removes opentrons- from connectable robot names',
      selector: discovery.getConnectableRobots,
      state: {
        discovery: {
          robotsByName: {
            'opentrons-foo': [makeConnectable('opentrons-foo', '10.0.0.1')],
            'opentrons-bar': [makeFullyUp('opentrons-bar', '10.0.0.2')],
          },
        },
        robot: {connection: {connectedTo: 'opentrons-bar'}},
      },
      expected: [
        makeConnectable(
          'opentrons-foo',
          '10.0.0.1',
          'connectable',
          false,
          'foo'
        ),
        makeFullyUp('opentrons-bar', '10.0.0.2', 'connectable', true, 'bar'),
      ],
    },
    {
      name: 'display name removes opentrons- from reachable robot names',
      selector: discovery.getReachableRobots,
      state: {
        discovery: {
          robotsByName: {
            'opentrons-foo': [makeServerUp('opentrons-foo', '10.0.0.1', false)],
            'opentrons-bar': [makeAdvertising('opentrons-bar', '10.0.0.2')],
          },
        },
      },
      expected: [
        makeServerUp('opentrons-foo', '10.0.0.1', false, 'reachable', 'foo'),
        makeAdvertising('opentrons-bar', '10.0.0.2', 'reachable', 'bar'),
      ],
    },
    {
      name: 'display name removes opentrons- from unreachable robot names',
      selector: discovery.getUnreachableRobots,
      state: {
        discovery: {
          robotsByName: {'opentrons-foo': [{name: 'opentrons-foo', ip: null}]},
        },
      },
      expected: [
        {
          name: 'opentrons-foo',
          ip: null,
          status: 'unreachable',
          displayName: 'foo',
        },
      ],
    },
  ]

  SPECS.forEach(spec => {
    const {name, selector, state, expected} = spec
    test(name, () => expect(selector(state)).toEqual(expected))
  })
})
