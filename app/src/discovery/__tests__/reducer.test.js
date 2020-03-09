// discovery reducer test
import { discoveryReducer } from '../reducer'

jest.mock('../../shell/remote', () => ({
  remote: {
    INITIAL_ROBOTS: [
      { name: 'foo', ip: '192.168.1.1', port: 31950 },
      { name: 'bar', ip: '192.168.1.2', port: 31950 },
    ],
  },
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
      initialState: { robotsByName: {} },
      expectedState: {
        robotsByName: {
          foo: [{ name: 'foo', ip: '192.168.1.1', port: 31950 }],
          bar: [{ name: 'bar', ip: '192.168.1.2', port: 31950 }],
        },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, initialState, expectedState } = spec
    it(name, () =>
      expect(discoveryReducer(initialState, action)).toEqual(expectedState)
    )
  })
})
