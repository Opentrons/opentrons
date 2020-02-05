// @flow
import * as Selectors from '../selectors'
import * as Constants from '../constants'
import * as Fixtures from '../__fixtures__'
import type { State } from '../../types'

type SelectorSpec = {|
  name: string,
  selector: ($Shape<State>, ...Array<any>) => mixed,
  state: $Shape<State>,
  args?: Array<any>,
  expected: mixed,
|}

describe('robot settings selectors', () => {
  const SPECS: Array<SelectorSpec> = [
    {
      name: 'getInternetStatus returns null if unavailable',
      selector: Selectors.getInternetStatus,
      state: { networking: {} },
      args: ['robotName'],
      expected: null,
    },
    {
      name: 'getInternetStatus returns internetStatus from state',
      selector: Selectors.getInternetStatus,
      state: {
        networking: {
          robotName: {
            internetStatus: Constants.STATUS_FULL,
          },
        },
      },
      args: ['robotName'],
      expected: Constants.STATUS_FULL,
    },
    {
      name: 'getNetworkInterfaces returns null if unavailable',
      selector: Selectors.getNetworkInterfaces,
      state: { networking: {} },
      args: ['robotName'],
      expected: { wifi: null, ethernet: null },
    },
    {
      name: 'getNetworkInterfaces returns interface from state',
      selector: Selectors.getNetworkInterfaces,
      state: {
        networking: {
          robotName: {
            interfaces: Fixtures.mockNetworkingStatus.interfaces,
          },
        },
      },
      args: ['robotName'],
      expected: {
        wifi: {
          ipAddress: '192.168.43.97',
          subnetMask: '255.255.255.0',
          macAddress: 'B8:27:EB:6C:95:CF',
          type: 'wifi',
        },
        ethernet: {
          ipAddress: '169.254.229.173',
          subnetMask: '255.255.0.0',
          macAddress: 'B8:27:EB:39:C0:9A',
          type: 'ethernet',
        },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec

    test(name, () => {
      const result = selector(state, ...args)
      expect(result).toEqual(expected)
    })
  })
})
