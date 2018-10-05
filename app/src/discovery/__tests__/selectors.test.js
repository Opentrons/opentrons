// discovery selectors tests
import * as discovery from '..'

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
      name: 'getUnreachableRobots grabs robots with no ip',
      selector: discovery.getUnreachableRobots,
      state: {
        discovery: {robotsByName: {foo: [{name: 'foo', ip: null}]}},
      },
      expected: [{name: 'foo'}],
    },
    {
      name: 'getUnreachableRobots grabs robots with IP but no responses',
      selector: discovery.getUnreachableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [
              {ip: '10.0.0.1', advertising: false, ok: false, serverOk: false},
              {ip: '10.0.0.2', advertising: false, ok: false, serverOk: false},
            ],
          },
        },
      },
      expected: [{name: 'foo'}],
    },
    {
      name: 'getUnreachableRobots will not grab reachable robots',
      selector: discovery.getUnreachableRobots,
      state: {
        discovery: {
          robotsByName: {
            foo: [
              {ip: '10.0.0.1', advertising: true, ok: false, serverOk: false},
              {ip: '10.0.0.2', advertising: false, ok: false, serverOk: false},
            ],
            bar: [
              {ip: '10.0.0.1', advertising: false, ok: true, serverOk: false},
              {ip: '10.0.0.2', advertising: false, ok: false, serverOk: false},
            ],
            baz: [
              {ip: '10.0.0.1', advertising: false, ok: false, serverOk: true},
              {ip: '10.0.0.2', advertising: false, ok: false, serverOk: false},
            ],
            qux: [
              {ip: '10.0.0.2', advertising: true, ok: true, serverOk: true},
            ],
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
