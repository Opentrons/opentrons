// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { CalibrationData } from '../LabwareListItem'

describe('CalibrationData', () => {
  let render

  beforeEach(() => {
    render = (props = {}) => {
      const { calibrationData = null, existingCalData = null } = props
      return mount(
        <CalibrationData
          calibrationData={calibrationData}
          existingCalData={existingCalData}
        />
      )
    }
  })

  it('displays not calibrated if no existing data and not calibrated in this session', () => {
    const wrapper = render()
    expect(wrapper.text().includes('Not yet calibrated')).toBe(true)
  })

  it('displays existing data if present and not calibrated in this session', () => {
    const wrapper = render({
      calibrationData: { x: 1, y: 0, z: 0 },
      existingCalData: null,
    })
    expect(wrapper.text().includes('Updated data')).toBe(true)
  })

  it('displays updated data if calibrated in this session', () => {
    const wrapper = render({
      calibrationData: { x: 1, y: 2, z: 0 },
      existingCalData: { x: 1, y: 0, z: 0 },
    })
    expect(wrapper.text().includes('Updated data')).toBe(true)
  })

  it('displays updated data if calibrated in this session with same data', () => {
    const wrapper = render({
      calibrationData: { x: 1, y: 0, z: 0 },
      existingCalData: { x: 1, y: 0, z: 0 },
    })
    expect(wrapper.text().includes('Existing data')).toBe(true)
  })
})
