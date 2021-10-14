import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
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
    when(getU2EAdapterDevice).calledWith(MOCK_STATE).mockReturnValue(null)

    when(getU2EWindowsDriverStatus)
      .calledWith(MOCK_STATE)
      .mockReturnValue(SystemInfo.NOT_APPLICABLE)
  })

  afterEach(() => {
    resetAllWhenMocks()
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

    when(getU2EAdapterDevice).calledWith(MOCK_STATE).mockReturnValue(device)

    const { wrapper } = render()
    const children = wrapper.children().html()

    expect(getU2EAdapterDevice).toHaveBeenCalledWith(MOCK_STATE)
    expect(children).toContain(device.deviceName)
    expect(children).toContain(device.manufacturer)
  })

  it('should display Windows driver version if available', () => {
    const device = Fixtures.mockWindowsRealtekDevice

    when(getU2EAdapterDevice).calledWith(MOCK_STATE).mockReturnValue(device)

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

    when(getU2EAdapterDevice).calledWith(MOCK_STATE).mockReturnValue(device)

    const { wrapper } = render()
    const children = wrapper.children().html()

    expect(getU2EAdapterDevice).toHaveBeenCalledWith(MOCK_STATE)
    expect(children).toContain('unknown')
  })

  it('should NOT show a U2EDriverWarning if driver status is UP_TO_DATE', () => {
    const device = Fixtures.mockWindowsRealtekDevice

    when(getU2EAdapterDevice).calledWith(MOCK_STATE).mockReturnValue(device)

    when(getU2EWindowsDriverStatus)
      .calledWith(MOCK_STATE)
      .mockReturnValue(SystemInfo.UP_TO_DATE)

    const { wrapper } = render()

    expect(wrapper.exists(U2EDriverWarning)).toBe(false)
  })

  it('should show a U2EDriverWarning if driver status is OUTDATED', () => {
    const device = Fixtures.mockWindowsRealtekDevice

    when(getU2EAdapterDevice).calledWith(MOCK_STATE).mockReturnValue(device)

    when(getU2EWindowsDriverStatus)
      .calledWith(MOCK_STATE)
      .mockReturnValue(SystemInfo.OUTDATED)

    const { wrapper } = render()

    expect(wrapper.exists(U2EDriverWarning)).toBe(true)
  })
})
