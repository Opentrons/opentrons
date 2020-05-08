// @flow
import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'

import { AlertModal } from '@opentrons/components'
import { U2EDriverOutdatedAlert } from '../U2EDriverOutdatedAlert'

// TODO(mc, 2020-05-07): create a tested Link wrapper that's safe to mock
jest.mock('react-router-dom', () => ({
  Link: () => <></>,
}))

// TODO(mc, 2020-05-07): remove this feature flag
jest.mock('../../../config/hooks', () => ({
  useFeatureFlag: flag => flag === 'systemInfoEnabled',
}))

const EXPECTED_DOWNLOAD_URL =
  'https://www.realtek.com/component/zoo/category/network-interface-controllers-10-100-1000m-gigabit-ethernet-usb-3-0-software'

describe('U2EDriverOutdatedAlert', () => {
  const dismissAlert = jest.fn()
  const render = () => {
    return mount(<U2EDriverOutdatedAlert dismissAlert={dismissAlert} />)
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render an AlertModal', () => {
    const wrapper = render()
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal.prop('heading')).toBe(
      'Realtek USB-to-Ethernet Driver Out of Date'
    )
  })

  it('should have a link to /network-and-system that dismisses the alert', () => {
    const wrapper = render()
    const link = wrapper.find('Link[to="/menu/network-and-system"]')

    link.invoke('onClick')()

    expect(link.prop('children')).toContain('view adapter info')
    expect(dismissAlert).toHaveBeenCalledWith(false)
  })

  it('should have a link to the Realtek website', () => {
    const wrapper = render()
    const link = wrapper.find(`a[href="${EXPECTED_DOWNLOAD_URL}"]`)

    link.invoke('onClick')()

    expect(link.prop('children')).toContain('get update')
    expect(dismissAlert).toHaveBeenCalledWith(false)
  })

  it('should be able to perma-ignore the alert', () => {
    const wrapper = render()
    const checkbox = wrapper.find(`input[type="checkbox"]`)

    act(() => {
      checkbox.simulate('change')
    })
    wrapper.update()
    wrapper.find('Link[to="/menu/network-and-system"]').invoke('onClick')()

    expect(dismissAlert).toHaveBeenCalledWith(true)
  })
})
