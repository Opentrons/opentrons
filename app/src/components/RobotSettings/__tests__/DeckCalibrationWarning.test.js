// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import * as Calibration from '../../../calibration'
import { Flex, Icon, COLOR_WARNING, COLOR_ERROR } from '@opentrons/components'
import { DeckCalibrationWarning } from '../DeckCalibrationWarning'

import type { DeckCalibrationStatus } from '../../../calibration/types'

describe('Calibration Warning Component', () => {
  const render = (status: DeckCalibrationStatus | null) => {
    return mount(<DeckCalibrationWarning deckCalibrationStatus={status} />)
  }

  it('renders nothing when calibration is unknown', () => {
    const wrapper = render(null)
    expect(wrapper).toEqual({})
  })

  it('renders nothing when calibration is OK', () => {
    const wrapper = render(Calibration.DECK_CAL_STATUS_OK)
    expect(wrapper).toEqual({})
  })

  it('should render an alert icon in COLOR_WARNING if status is IDENTITY', () => {
    const wrapper = render(Calibration.DECK_CAL_STATUS_IDENTITY)
    const parent = wrapper.find(Flex).first()
    const icon = wrapper.find(Icon)

    expect(parent.prop('color')).toBe(COLOR_WARNING)
    expect(icon.prop('name')).toEqual('alert-circle')
    expect(wrapper.html()).toMatch(/not yet been calibrated/i)
    expect(wrapper.html()).toMatch(/please perform a deck calibration/i)
  })

  it('should render an alert icon in COLOR_ERROR if status is SINGULARITY', () => {
    const wrapper = render(Calibration.DECK_CAL_STATUS_SINGULARITY)
    const parent = wrapper.find(Flex).first()
    const icon = wrapper.find(Icon)

    expect(parent.prop('color')).toBe(COLOR_ERROR)
    expect(icon.prop('name')).toEqual('alert-circle')
    expect(wrapper.html()).toMatch(/bad deck calibration detected/i)
    expect(wrapper.html()).toMatch(/please perform a deck calibration/i)
  })

  it('should render an alert icon in COLOR_ERROR if status is BAD_CALIBRATION', () => {
    const wrapper = render(Calibration.DECK_CAL_STATUS_BAD_CALIBRATION)
    const parent = wrapper.find(Flex).first()
    const icon = wrapper.find(Icon)

    expect(parent.prop('color')).toBe(COLOR_ERROR)
    expect(icon.prop('name')).toEqual('alert-circle')
    expect(wrapper.html()).toMatch(/bad deck calibration detected/i)
    expect(wrapper.html()).toMatch(/please perform a deck calibration/i)
  })
})
