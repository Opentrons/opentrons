// @flow

import * as Fixtures from '../__fixtures__'
import * as Selectors from '../selectors'
import type { State } from '../../types'

describe('robot controls selectors', () => {
  it('should return null by default with getU2EAdapterDevice', () => {
    const state: State = ({ systemInfo: { usbDevices: [] } }: $Shape<State>)

    expect(Selectors.getU2EAdapterDevice(state)).toBe(null)
  })

  it('should return a Realtek device with getU2EAdapterDevice', () => {
    const state: State = ({
      systemInfo: {
        usbDevices: [Fixtures.mockUsbDevice, Fixtures.mockRealtekDevice],
      },
    }: $Shape<State>)

    expect(Selectors.getU2EAdapterDevice(state)).toBe(
      Fixtures.mockRealtekDevice
    )
  })
})
