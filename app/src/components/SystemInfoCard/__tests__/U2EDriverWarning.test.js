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

import { U2E_DRIVER_UPDATE_URL } from '../../../system-info'
import { U2EDriverWarning } from '../U2EDriverWarning'

describe('U2EDriverWarning', () => {
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
})
