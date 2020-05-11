// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import {
  Flex,
  Icon,
  Text,
  ALIGN_START,
  COLOR_WARNING,
} from '@opentrons/components'

import * as Analytics from '../../../analytics'
import { U2E_DRIVER_UPDATE_URL } from '../../../system-info'
import { U2EDriverWarning } from '../U2EDriverWarning'

jest.mock('../../../analytics')

const useTrackEvent: JestMockFn<[], $Call<typeof Analytics.useTrackEvent>> =
  Analytics.useTrackEvent

describe('U2EDriverWarning', () => {
  const trackEvent = jest.fn()

  beforeEach(() => {
    useTrackEvent.mockReturnValue(trackEvent)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a box with an icon and text', () => {
    const wrapper = mount(<U2EDriverWarning />)
    const box = wrapper.find(Flex)
    const icon = box.find(Icon)
    const text = box.find(Text)

    expect(box.prop('alignItems')).toBe(ALIGN_START)
    expect(icon.prop('name')).toBe('alert-circle')
    expect(text.html()).toMatch(/Realtek USB-to-Ethernet adapter driver/)
  })

  it('should set the color to COLOR_WARNING', () => {
    const wrapper = mount(<U2EDriverWarning />)
    const box = wrapper.find(Flex)

    expect(box.prop('color')).toBe(COLOR_WARNING)
  })

  it('should show a link to the driver download page', () => {
    const wrapper = mount(<U2EDriverWarning />)
    const link = wrapper.find(`a[href="${U2E_DRIVER_UPDATE_URL}"]`)

    expect(link.prop('target')).toBe('_blank')
    expect(link.prop('rel')).toBe('noopener noreferrer')
    expect(link.html()).toMatch(/get update/i)
  })

  it('should send an analytics event if the driver link is clicked', () => {
    const wrapper = mount(<U2EDriverWarning />)
    const link = wrapper.find(`a[href="${U2E_DRIVER_UPDATE_URL}"]`)

    link.simulate('click')

    expect(trackEvent).toHaveBeenCalledWith({
      name: 'u2eDriverLinkClicked',
      properties: { source: 'card' },
    })
  })
})
