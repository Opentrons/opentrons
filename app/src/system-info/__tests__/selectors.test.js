// @flow

import * as Fixtures from '../__fixtures__'
import * as Selectors from '../selectors'
import type { State } from '../../types'

type SelectorSpec = {|
  should: string,
  selector: State => mixed,
  state: $Shape<State>,
  expected: mixed,
|}

const SPECS: Array<SelectorSpec> = [
  {
    should: 'return null by default with getU2EAdapterDevice',
    selector: Selectors.getU2EAdapterDevice,
    state: { systemInfo: { usbDevices: [] } },
    expected: null,
  },
  {
    should: 'return a Realtek device with getU2EAdapterDevice',
    selector: Selectors.getU2EAdapterDevice,
    state: {
      systemInfo: {
        usbDevices: [Fixtures.mockUsbDevice, Fixtures.mockRealtekDevice],
      },
    },
    expected: Fixtures.mockRealtekDevice,
  },
]

describe('robot controls selectors', () => {
  SPECS.forEach(spec => {
    const { should, selector, state, expected } = spec
    it(`should ${should}`, () => expect(selector(state)).toEqual(expected))
  })
})
