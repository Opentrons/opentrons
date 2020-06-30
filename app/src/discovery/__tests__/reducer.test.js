// discovery reducer test
import { discoveryReducer } from '../reducer'

describe('discoveryReducer', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const SPECS = [
    {
      name: 'empty dict for robotsByName and sets scanning to false',
      action: {},
      initialState: undefined,
      expectedState: {
        scanning: false,
        robotsByName: {},
      },
    },
    {
      name: 'discovery:START sets scanning: true',
      action: { type: 'discovery:START' },
      initialState: { scanning: false },
      expectedState: { scanning: true },
    },
    {
      name: 'shell:UI_INITIALIZED sets scanning: true',
      action: { type: 'shell:UI_INITIALIZED' },
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
