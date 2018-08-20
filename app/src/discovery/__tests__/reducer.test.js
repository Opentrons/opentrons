// discovery reducer test
import {discoveryReducer} from '..'

jest.mock('../../shell', () => ({
  getShellRobots: () => ([
    {name: 'foo', connections: []},
    {name: 'bar', connections: []}
  ])
}))

describe('discoveryReducer', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const SPECS = [
    {
      name: 'pulls initial robot list from shell and sets scanning to false',
      action: {},
      initialState: undefined,
      expectedState: {
        scanning: false,
        robotsByName: {
          foo: {name: 'foo', connections: []},
          bar: {name: 'bar', connections: []}
        }
      }
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
