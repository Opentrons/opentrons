import * as React from 'react'
import { mountWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import * as Fixtures from '../../../../redux/system-info/__fixtures__'
import * as SystemInfo from '../../../../redux/system-info'
import { U2EAdapterInfo } from '../U2EAdapterInfo'
import { U2EDriverWarning } from '../U2EDriverWarning'

import type { State, Action } from '../../../../redux/types'

jest.mock('../../../../redux/system-info/selectors')
jest.mock('../../../../redux/analytics')

const MOCK_STATE: State = { mockState: true } as any

const getU2EAdapterDevice = SystemInfo.getU2EAdapterDevice as jest.MockedFunction<
  typeof SystemInfo.getU2EAdapterDevice
>

const getU2EWindowsDriverStatus = SystemInfo.getU2EWindowsDriverStatus as jest.MockedFunction<
  typeof SystemInfo.getU2EWindowsDriverStatus
>

function stubSelector<R>(
  mock: jest.MockedFunction<(s: State) => R>,
  rVal: R
): void {
  mock.mockImplementation(state => {
    expect(state).toBe(MOCK_STATE)
    return rVal
  })
}

describe('U2EAdapterInfo', () => {
  const render = () => {
    return mountWithProviders<
      React.ComponentProps<typeof U2EAdapterInfo>,
      State,
      Action
    >(<U2EAdapterInfo />, {
      initialState: MOCK_STATE,
      i18n,
    })
  }

  beforeEach(() => {
    stubSelector(getU2EAdapterDevice, null)
    stubSelector(getU2EWindowsDriverStatus, SystemInfo.NOT_APPLICABLE)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a title', () => {
    const { wrapper } = render()
    const children = wrapper.children().html()

    expect(children).toContain('USB-to-Ethernet Adapter Information')
  })

  it('should display a "not found" message if no device is plugged in', () => {
    const { wrapper } = render()

    expect(wrapper.children().html()).toMatch(
      /No OT-2 USB-to-Ethernet adapter found/i
    )
  })

  it('should display device information if present', () => {
    const device = Fixtures.mockRealtekDevice

    stubSelector(getU2EAdapterDevice, device)

    const { wrapper } = render()
    const children = wrapper.children().html()

    expect(getU2EAdapterDevice).toHaveBeenCalledWith(MOCK_STATE)
    expect(children).toContain(device.deviceName)
    expect(children).toContain(device.manufacturer)
  })

  it('should display Windows driver version if available', () => {
    const device = Fixtures.mockWindowsRealtekDevice

    stubSelector(getU2EAdapterDevice, device)

    const { wrapper } = render()
    const children = wrapper.children().html()

    expect(getU2EAdapterDevice).toHaveBeenCalledWith(MOCK_STATE)
    expect(children).toContain(device.windowsDriverVersion)
  })

  it('should display "unknown" driver version if Windows but not available', () => {
    const device = {
      ...Fixtures.mockWindowsRealtekDevice,
      windowsDriverVersion: null,
    }

    stubSelector(getU2EAdapterDevice, device)

    const { wrapper } = render()
    const children = wrapper.children().html()

    expect(getU2EAdapterDevice).toHaveBeenCalledWith(MOCK_STATE)
    expect(children).toContain('unknown')
  })

  it('should NOT show a U2EDriverWarning if driver status is UP_TO_DATE', () => {
    const device = Fixtures.mockWindowsRealtekDevice

    stubSelector(getU2EAdapterDevice, device)
    stubSelector(getU2EWindowsDriverStatus, SystemInfo.UP_TO_DATE)

    const { wrapper } = render()

    expect(wrapper.exists(U2EDriverWarning)).toBe(false)
  })

  it('should show a U2EDriverWarning if driver status is OUTDATED', () => {
    const device = Fixtures.mockWindowsRealtekDevice

    stubSelector(getU2EAdapterDevice, device)
    stubSelector(getU2EWindowsDriverStatus, SystemInfo.OUTDATED)

    const { wrapper } = render()

    expect(wrapper.exists(U2EDriverWarning)).toBe(true)
  })
})
