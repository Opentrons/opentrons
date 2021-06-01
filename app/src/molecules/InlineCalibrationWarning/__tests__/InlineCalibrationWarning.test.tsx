import * as React from 'react'
import { mount } from 'enzyme'

import {
  Flex,
  Icon,
  COLOR_ERROR,
  COLOR_WARNING,
  SPACING_2,
  SPACING_1,
} from '@opentrons/components'
import { InlineCalibrationWarning, REQUIRED, RECOMMENDED } from '..'

describe('Calibration Warning Component', () => {
  it('renders nothing when no warning is requested', () => {
    const wrapper = mount(<InlineCalibrationWarning warningType={null} />)
    expect(wrapper).toEqual({})
  })

  it('renders using error color when requested', () => {
    const wrapper = mount(<InlineCalibrationWarning warningType={REQUIRED} />)
    const parent = wrapper.find(Flex).first()
    const icon = wrapper.find(Icon)

    expect(parent.prop('color')).toBe(COLOR_ERROR)
    expect(icon.prop('name')).toEqual('alert-circle')
    expect(wrapper.html()).toMatch(/required/i)
  })

  it('renders using warning color when requested', () => {
    const wrapper = mount(
      <InlineCalibrationWarning warningType={RECOMMENDED} />
    )
    const parent = wrapper.find(Flex).first()
    const icon = wrapper.find(Icon)

    expect(parent.prop('color')).toBe(COLOR_WARNING)
    expect(icon.prop('name')).toEqual('alert-circle')
    expect(wrapper.html()).toMatch(/recommended/i)
  })

  it('has a default marginTop if not overridden', () => {
    const wrapper = mount(<InlineCalibrationWarning warningType={REQUIRED} />)
    const parent = wrapper.find(Flex).first()
    expect(parent.prop('marginTop')).toEqual(SPACING_2)
  })

  it('allows marginTop to be overridden', () => {
    const wrapper = mount(
      <InlineCalibrationWarning warningType={REQUIRED} marginTop={SPACING_1} />
    )
    const parent = wrapper.find(Flex).first()
    expect(parent.prop('marginTop')).toEqual(SPACING_1)
  })
})
