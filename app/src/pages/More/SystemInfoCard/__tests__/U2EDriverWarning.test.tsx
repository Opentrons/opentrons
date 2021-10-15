import * as React from 'react'

import {
  mountWithProviders,
  Flex,
  Icon,
  Text,
  ALIGN_CENTER,
  COLOR_WARNING,
} from '@opentrons/components'

import { i18n } from '../../../../i18n'
import * as Analytics from '../../../../redux/analytics'
import { U2E_DRIVER_UPDATE_URL } from '../../../../redux/system-info'
import { U2EDriverWarning } from '../U2EDriverWarning'

import type { State, Action } from '../../../../redux/types'

jest.mock('../../../../redux/analytics')

const MOCK_STATE: State = { mockState: true } as any

const EXPECTED_REALTEK_ADAPTER_DESCRIPTION = `Some OT-2's have an internal USB-to-Ethernet adapter. If your OT-2 uses this adapter, it will be added to your computer's device list when you make a wired connection. If you have a Realtek adapter, it is essential that the driver is up to date.`

const useTrackEvent = Analytics.useTrackEvent as jest.MockedFunction<
  typeof Analytics.useTrackEvent
>

describe('U2EDriverWarning', () => {
  const render = () => {
    return mountWithProviders<
      React.ComponentProps<typeof U2EDriverWarning>,
      State,
      Action
    >(<U2EDriverWarning />, {
      initialState: MOCK_STATE,
      i18n,
    })
  }

  const trackEvent: jest.MockedFunction<
    typeof Analytics.useTrackEvent
  > = jest.fn()

  beforeEach(() => {
    useTrackEvent.mockReturnValue(trackEvent)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a description of the Realtek driver', () => {
    const { wrapper } = render()

    expect(wrapper.contains(EXPECTED_REALTEK_ADAPTER_DESCRIPTION)).toBe(true)
  })

  it('should render a box with an icon and text', () => {
    const { wrapper } = render()
    const box = wrapper.find(Flex)
    const icon = box.find(Icon)
    const text = box.find(Text)

    expect(box.prop('alignItems')).toBe(ALIGN_CENTER)
    expect(icon.prop('name')).toBe('alert-circle')
    expect(text.html()).toMatch(
      /Update available for Realtek USB-to-Ethernet adapter driver/
    )
  })

  it('should set the color to COLOR_WARNING', () => {
    const { wrapper } = render()
    const box = wrapper.find(Flex)

    expect(box.prop('color')).toBe(COLOR_WARNING)
  })

  it('should show a link to the driver download page', () => {
    const { wrapper } = render()
    const link = wrapper.find(`a[href="${U2E_DRIVER_UPDATE_URL}"]`)

    expect(link.prop('target')).toBe('_blank')
    expect(link.prop('rel')).toBe('noopener noreferrer')
    expect(link.html()).toContain('Launch Realtek Adapter Drivers Site')
  })

  it('should send an analytics event if the driver link is clicked', () => {
    const { wrapper } = render()
    const link = wrapper.find(`a[href="${U2E_DRIVER_UPDATE_URL}"]`)

    link.simulate('click')

    expect(trackEvent).toHaveBeenCalledWith({
      name: 'u2eDriverLinkClicked',
      properties: { source: 'card' },
    })
  })
})
