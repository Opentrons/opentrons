// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { PrimaryButton } from '@opentrons/components'
import { Continue } from '../Continue'

describe('Continue to run or calibration button component', () => {
  const render = (status: boolean = false) => {
    return mount(<Continue labwareCalibrated={status} />)
  }

  it('Default button renders to continue to labware when not all labware is calibrated', () => {
    const wrapper = render()
    const button = wrapper.find(PrimaryButton)
    console.log(button)
    expect(button.children).toEqual('Proceed to Calibrate')
  })

  it('renders nothing when calibration is OK', () => {
    const wrapper = render(true)
    const button = wrapper.find(PrimaryButton)
    console.log(button.children)
    expect(button.children).toEqual('Proceed to Calibrate')
  })
})
