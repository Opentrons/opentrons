// discovery selectors tests
import * as discovery from '..'

const makeFullyUp = (
  name,
  displayName,
  ip,
  status = null,
  connected = null
) => ({
  name,
  displayName,
  ip,
  local: false,
  ok: true,
  serverOk: true,
  advertising: true,
  health: {},
  serverHealth: {},
  status,
  connected,
})

const makeConnectable = (
  name,
  displayName,
  ip,
  status = null,
  connected = null
) => ({
  name,
  displayName,
  ip,
  local: false,
  ok: true,
  serverOk: false,
  health: {},
  status,
  connected,
})

const makeAdvertising = (name, displayName, ip, status = null) => ({
  name,
  displayName,
  ip,
  local: false,
  ok: false,
  serverOk: false,
  advertising: true,
  status,
})

const makeServerUp = (name, displayName, ip, advertising, status = null) => ({
  name,
  displayName,
  ip,
  advertising,
  local: false,
  ok: false,
  serverOk: true,
  serverHealth: {},
  status,
})

const makeUnreachable = (name, displayName, ip, status = null) => ({
  name,
  displayName,
  ip,
  local: false,
  ok: false,
  serverOk: false,
  advertising: false,
  status,
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
            foo: [makeConnectable('foo', 'foo', '10.0.0.1')],
            bar: [makeFullyUp('bar', 'bar', '10.0.0.2')],
          },
        },
        robot: {connection: {connectedTo: 'bar'}},
      },
      expected: [
        makeConnectable('foo', 'foo', '10.0.0.1', 'connectable', false),
        makeFullyUp('bar', 'bar', '10.0.0.2', 'connectable', true),
      ],
    },
    {
      name: 'getConnectableRobots grabs correct service',
      selector: discovery.getConnectableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [
              makeConnectable('foo', 'foo', '10.0.0.1'),
              makeConnectable('foo', 'foo', '10.0.0.2'),
              makeServerUp('foo', 'foo', '10.0.0.3', false),
              makeAdvertising('foo', 'foo', '10.0.0.4', false),
            ],
          },
        },
        robot: {connection: {connectedTo: 'foo'}},
      },
      expected: [
        makeConnectable('foo', 'foo', '10.0.0.1', 'connectable', true),
      ],
    },
    {
      name: 'getReachableRobots grabs robots with serverUp or advertising',
      selector: discovery.getReachableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [makeServerUp('foo', 'foo', '10.0.0.1', false)],
            bar: [makeAdvertising('bar', 'bar', '10.0.0.2')],
          },
        },
      },
      expected: [
        makeServerUp('foo', 'foo', '10.0.0.1', false, 'reachable'),
        makeAdvertising('bar', 'bar', '10.0.0.2', 'reachable'),
      ],
    },
    {
      name: 'getReachableRobots grabs correct service',
      selector: discovery.getReachableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [
              makeServerUp('foo', 'foo', '10.0.0.1', true),
              makeServerUp('foo', 'foo', '10.0.0.1', false),
              makeAdvertising('foo', 'foo', '10.0.0.2'),
            ],
          },
        },
      },
      expected: [makeServerUp('foo', 'foo', '10.0.0.1', true, 'reachable')],
    },
    {
      name: 'getReachableRobots does not grab connectable robots',
      selector: discovery.getReachableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [
              makeConnectable('foo', 'foo', '10.0.0.1'),
              makeServerUp('foo', 'foo', '10.0.0.2', true),
            ],
            bar: [
              makeConnectable('bar', 'bar', '10.0.0.3'),
              makeServerUp('bar', 'bar', '10.0.0.4', false),
            ],
            baz: [
              makeConnectable('baz', 'baz', '10.0.0.5'),
              makeAdvertising('baz', 'baz', '10.0.0.6'),
            ],
            qux: [makeFullyUp('qux', 'baz', '10.0.0.7')],
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
          robotsByName: {foo: [{name: 'foo', displayName: 'foo', ip: null}]},
        },
      },
      expected: [
        {name: 'foo', displayName: 'foo', ip: null, status: 'unreachable'},
      ],
    },
    {
      name: 'getUnreachableRobots grabs robots with IP but no responses',
      selector: discovery.getUnreachableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [
              makeUnreachable('foo', 'foo', '10.0.0.1'),
              makeUnreachable('foo', 'foo', '10.0.0.2'),
            ],
          },
        },
      },
      expected: [makeUnreachable('foo', 'foo', '10.0.0.1', 'unreachable')],
    },
    {
      name: "getUnreachableRobots won't grab connectable/reachable robots",
      selector: discovery.getUnreachableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [
              makeServerUp('foo', 'foo', '10.0.0.1', true),
              makeUnreachable('foo', 'foo', '10.0.0.2'),
            ],
            bar: [
              makeServerUp('bar', 'bar', '10.0.0.3', false),
              makeUnreachable('bar', '10.0.0.4'),
            ],
            baz: [
              makeAdvertising('bar', 'bar', '10.0.0.5'),
              makeUnreachable('baz', 'baz', '10.0.0.6'),
            ],
            qux: [makeConnectable('qux', 'qux', '10.0.0.7')],
          },
        },
      },
      expected: [],
    },
  ]

  SPECS.forEach(spec => {
    const {name, selector, state, expected} = spec
    test(name, () => expect(selector(state)).toEqual(expected))
  })
})
