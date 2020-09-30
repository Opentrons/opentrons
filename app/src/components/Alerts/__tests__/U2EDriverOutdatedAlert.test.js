// @flow
import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'

import { AlertModal } from '@opentrons/components'
import * as Analytics from '../../../analytics'
import { U2EDriverOutdatedAlert } from '../U2EDriverOutdatedAlert'

jest.mock('../../../analytics')

jest.mock('react-router-dom', () => ({
  // TODO(mc, 2020-05-07): create a tested Link wrapper that's safe to mock
  Link: () => <></>,
}))

// TODO(mc, 2020-05-07): remove this feature flag
jest.mock('../../../config/hooks', () => ({
  useFeatureFlag: flag => flag === 'systemInfoEnabled',
}))

const EXPECTED_DOWNLOAD_URL =
  'https://www.realtek.com/en/component/zoo/category/network-interface-controllers-10-100-1000m-gigabit-ethernet-usb-3-0-software'

const useTrackEvent: JestMockFn<[], $Call<typeof Analytics.useTrackEvent>> =
  Analytics.useTrackEvent

describe('U2EDriverOutdatedAlert', () => {
  const dismissAlert = jest.fn()
  const trackEvent = jest.fn()
  const render = () => {
    return mount(<U2EDriverOutdatedAlert dismissAlert={dismissAlert} />)
  }

  beforeEach(() => {
    useTrackEvent.mockReturnValue(trackEvent)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render an AlertModal', () => {
    const wrapper = render()
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal.prop('heading')).toBe(
      'Realtek USB-to-Ethernet Driver Update Available'
    )
  })

  it('should have a link to /network-and-system that dismisses the alert', () => {
    const wrapper = render()
    const link = wrapper.find('Link[to="/more/network-and-system"]')

    link.invoke('onClick')()

    expect(link.prop('children')).toContain('view adapter info')
    expect(dismissAlert).toHaveBeenCalledWith(false)
    expect(trackEvent).toHaveBeenCalledWith({
      name: 'u2eDriverAlertDismissed',
      properties: { rememberDismiss: false },
    })
  })

  it('should have a link to the Realtek website', () => {
    const wrapper = render()
    const link = wrapper.find(`a[href="${EXPECTED_DOWNLOAD_URL}"]`)

    link.invoke('onClick')()

    expect(link.prop('children')).toContain('get update')
    expect(dismissAlert).toHaveBeenCalledWith(false)
    expect(trackEvent).toHaveBeenCalledWith({
      name: 'u2eDriverLinkClicked',
      properties: { source: 'modal' },
    })
  })

  it('should be able to perma-ignore the alert', () => {
    const wrapper = render()
    const checkbox = wrapper.find(`input[type="checkbox"]`)

    act(() => {
      checkbox.simulate('change')
    })
    wrapper.update()
    wrapper.find('Link[to="/more/network-and-system"]').invoke('onClick')()

    expect(dismissAlert).toHaveBeenCalledWith(true)
    expect(trackEvent).toHaveBeenCalledWith({
      name: 'u2eDriverAlertDismissed',
      properties: { rememberDismiss: true },
    })
  })
})
