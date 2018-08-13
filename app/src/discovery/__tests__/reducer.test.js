// discovery reducer test
import {discoveryReducer} from '..'

describe('discoveryReducer', () => {
  const SPECS = [
    // TODO(mc, 2018-08-10): legacy; remove when DC enabled by default
    {
      name: 'robot:DISCOVER sets scanning: true',
      action: {type: 'robot:DISCOVER'},
      initialState: {scanning: false},
      expectedState: {scanning: true}
    },
    // TODO(mc, 2018-08-10): legacy; remove when DC enabled by default
    {
      name: 'robot:DISCOVER_FINISH sets scanning: false',
      action: {type: 'robot:DISCOVER_FINISH'},
      initialState: {scanning: true},
      expectedState: {scanning: false}
    },
    {
      name: 'discovery:START sets scanning: true',
      action: {type: 'discovery:START'},
      initialState: {scanning: false},
      expectedState: {scanning: true}
    },
    {
      name: 'discovery:FINISH sets scanning: false',
      action: {type: 'discovery:FINISH'},
      initialState: {scanning: true},
      expectedState: {scanning: false}
    },
    // TODO(mc, 2018-08-10): legacy; remove when DC enabled by default
    {
      name: 'robot:ADD_DISCOVERED adds robot to list',
      action: {
        type: 'robot:ADD_DISCOVERED',
        payload: {name: 'foo', ip: '192.168.1.42', port: 31950, wired: false}
      },
      initialState: {robotsByName: {}},
      expectedState: {
        robotsByName: {
          foo: {
            name: 'foo',
            connections: [
              {ip: '192.168.1.42', port: 31950, ok: true, local: false}
            ]
          }
        }
      }
    },
    // TODO(mc, 2018-08-10): legacy; remove when DC enabled by default
    {
      name: 'robot:REMOVE_DISCOVERED sets ok to false',
      action: {
        type: 'robot:REMOVE_DISCOVERED',
        payload: {name: 'foo', ip: '192.168.1.42', port: 31950, wired: false}
      },
      initialState: {robotsByName: {}},
      expectedState: {
        robotsByName: {
          foo: {
            name: 'foo',
            connections: [
              {ip: '192.168.1.42', port: 31950, ok: false, local: false}
            ]
          }
        }
      }
    },
    {
      name: 'discovery:UPDATE_LIST resets discovered list',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [
            {name: 'foo', connections: []},
            {name: 'bar', connections: []}
          ]
        }
      },
      initialState: {robotsByName: {}},
      expectedState: {
        robotsByName: {
          foo: {name: 'foo', connections: []},
          bar: {name: 'bar', connections: []}
        }
      }
    }
  ]

  SPECS.forEach(spec => {
    const {name, action, initialState, expectedState} = spec
    test(name, () =>
      expect(discoveryReducer(initialState, action)).toEqual(expectedState)
    )
  })
})
