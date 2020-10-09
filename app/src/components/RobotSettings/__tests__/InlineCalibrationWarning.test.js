// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import * as Calibration from '../../../calibration'
import { Flex, Icon, COLOR_ERROR, COLOR_WARNING } from '@opentrons/components'
import { InlineCalibrationWarning, REQUIRED, RECOMMENDED } from '../InlineCalibrationWarning'
import type { WarningType} from '../InlineCalibrationWarning'

describe('Calibration Warning Component', () => {
  const render = (
    warningType: WarningType | null
  ) => {
    return mount(
      <InlineCalibrationWarning
        warningType={warningType}
      />
    )
  }

  it('renders nothing when no warning is requested', () => {
    const wrapper = render(null)
    expect(wrapper).toEqual({})
  })

  it('renders using error color when requested', () => {
    const wrapper = render(REQUIRED)
    const parent = wrapper.find(Flex).first()
    const icon = wrapper.find(Icon)

    expect(parent.prop('color')).toBe(COLOR_ERROR)
    expect(icon.prop('name')).toEqual('alert-circle')
    expect(wrapper.html()).toMatch(/required/i)
  })

  it('renders using warning color when requested', () => {
    const wrapper = render(RECOMMENDED)
    const parent = wrapper.find(Flex).first()
    const icon = wrapper.find(Icon)

    expect(parent.prop('color')).toBe(COLOR_WARNING)
    expect(icon.prop('name')).toEqual('alert-circle')
    expect(wrapper.html()).toMatch(/recommended/i)
  })
})
