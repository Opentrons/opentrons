// discovery reducer test
import { discoveryReducer } from '..'

jest.mock('../../shell/remote', () => ({
  INITIAL_ROBOTS: [
    { name: 'foo', ip: '192.168.1.1', port: 31950 },
    { name: 'bar', ip: '192.168.1.2', port: 31950 },
  ],
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
        restartsByName: {},
        robotsByName: {
          foo: [{ name: 'foo', ip: '192.168.1.1', port: 31950 }],
          bar: [{ name: 'bar', ip: '192.168.1.2', port: 31950 }],
        },
      },
    },
    {
      name: 'discovery:START sets scanning: true',
      action: { type: 'discovery:START' },
      initialState: { scanning: false },
      expectedState: { scanning: true },
    },
    {
      name: 'discovery:FINISH sets scanning: false',
      action: { type: 'discovery:FINISH' },
      initialState: { scanning: true },
      expectedState: { scanning: false },
    },
    {
      name: 'discovery:UPDATE_LIST resets discovered list',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [
            { name: 'foo', ip: '192.168.1.1', port: 31950 },
            { name: 'bar', ip: '192.168.1.2', port: 31950 },
          ],
        },
      },
      initialState: { robotsByName: {}, restartsByName: {} },
      expectedState: {
        robotsByName: {
          foo: [{ name: 'foo', ip: '192.168.1.1', port: 31950 }],
          bar: [{ name: 'bar', ip: '192.168.1.2', port: 31950 }],
        },
        restartsByName: {},
      },
    },
    {
      name: 'api:SERVER_SUCCESS sets restart pending',
      action: {
        type: 'api:SERVER_SUCCESS',
        payload: { path: 'restart', robot: { name: 'name' } },
      },
      initialState: { restartsByName: {} },
      expectedState: { restartsByName: { name: 'pending' } },
    },
    {
      name: 'discovery:UPDATE_LIST sets restart down if pending robot not ok',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [{ name: 'name', ip: '192.168.1.1', port: 31950, ok: false }],
        },
      },
      initialState: { restartsByName: { name: 'pending' } },
      expectedState: {
        robotsByName: {
          name: [{ name: 'name', ip: '192.168.1.1', port: 31950, ok: false }],
        },
        restartsByName: { name: 'down' },
      },
    },
    {
      name: 'discovery:UPDATE_LIST clears restart if down robot ok',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [{ name: 'name', ip: '192.168.1.1', port: 31950, ok: true }],
        },
      },
      initialState: { restartsByName: { name: 'down' } },
      expectedState: {
        robotsByName: {
          name: [{ name: 'name', ip: '192.168.1.1', port: 31950, ok: true }],
        },
        restartsByName: { name: null },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, initialState, expectedState } = spec
    test(name, () =>
      expect(discoveryReducer(initialState, action)).toEqual(expectedState)
    )
  })
})
