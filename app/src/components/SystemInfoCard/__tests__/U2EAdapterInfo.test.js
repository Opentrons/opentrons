// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import noop from 'lodash/noop'

import * as Fixtures from '../../../system-info/__fixtures__'
import * as SystemInfo from '../../../system-info'
import { ControlSection } from '@opentrons/components'
import { U2EAdapterInfo } from '../U2EAdapterInfo'

import type { State } from '../../../types'
import type { UsbDevice } from '../../../system-info/types'

jest.mock('../../../system-info/selectors')

const MOCK_STATE: State = ({ mockState: true }: any)

const MOCK_STORE = {
  getState: () => MOCK_STATE,
  dispatch: noop,
  subscribe: noop,
}

const getU2EAdapterDevice: JestMockFn<[State], UsbDevice | null> =
  SystemInfo.getU2EAdapterDevice

describe('U2EAdapterInfo', () => {
  const render = () => {
    return mount(<U2EAdapterInfo />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: MOCK_STORE },
    })
  }

  beforeEach(() => {
    getU2EAdapterDevice.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a LabeledControl with the proper title', () => {
    const wrapper = render()
    expect(wrapper.find(ControlSection).prop('title')).toBe(
      'USB-to-Ethernet Adapter Information'
    )
  })

  it('should render a description of the information', () => {
    const wrapper = render()

    expect(wrapper.children().html()).toMatch(
      /The OT-2 uses a USB-to-Ethernet adapter for its wired connection/
    )
  })

  it('should display a "not found" message if no device is plugged in', () => {
    const wrapper = render()

    expect(wrapper.children().html()).toMatch(
      /no OT-2 USB-to-Ethernet adapter/i
    )
  })

  it('should display device information if present', () => {
    const device = Fixtures.mockRealtekDevice

    getU2EAdapterDevice.mockReturnValue(device)

    const wrapper = render()
    const children = wrapper.children().html()

    expect(getU2EAdapterDevice).toHaveBeenCalledWith(MOCK_STATE)
    expect(children).toContain(device.deviceName)
    expect(children).toContain(device.manufacturer)
    expect(children).toContain(device.serialNumber)
  })

  it('should display Windows driver version if available', () => {
    const device = Fixtures.mockWindowsRealtekDevice

    getU2EAdapterDevice.mockReturnValue(device)

    const wrapper = render()
    const children = wrapper.children().html()

    expect(getU2EAdapterDevice).toHaveBeenCalledWith(MOCK_STATE)
    expect(children).toContain(device.windowsDriverVersion)
  })

  it('should display "unknown" driver version if Windows but not available', () => {
    const device = {
      ...Fixtures.mockWindowsRealtekDevice,
      windowsDriverVersion: null,
    }

    getU2EAdapterDevice.mockReturnValue(device)

    const wrapper = render()
    const children = wrapper.children().html()

    expect(getU2EAdapterDevice).toHaveBeenCalledWith(MOCK_STATE)
    expect(children).toContain('unknown')
  })
})
