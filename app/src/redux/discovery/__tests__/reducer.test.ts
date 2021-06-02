// discovery reducer test
import { discoveryReducer } from '../reducer'

import type { Action } from '../../types'
import type { DiscoveryState } from '../types'

describe('discoveryReducer', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const SPECS: Array<{
    name: string
    action: Action
    initialState: DiscoveryState
    expectedState: DiscoveryState
  }> = [
    {
      name: 'empty dict for robotsByName and sets scanning to false',
      action: {} as any,
      initialState: undefined,
      expectedState: {
        scanning: false,
        robotsByName: {},
      },
    },
    {
      name: 'discovery:START sets scanning: true',
      action: { type: 'discovery:START' } as any,
      initialState: { scanning: false } as any,
      expectedState: { scanning: true } as any,
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
            { name: 'foo', health: null, serverHealth: null, addresses: [] },
            { name: 'bar', health: null, serverHealth: null, addresses: [] },
          ],
        },
      },
      initialState: { robotsByName: {} },
      expectedState: {
        robotsByName: {
          foo: { name: 'foo', health: null, serverHealth: null, addresses: [] },
          bar: { name: 'bar', health: null, serverHealth: null, addresses: [] },
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
