// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { CalibrationData } from '../CalibrationData'

describe('CalibrationData', () => {
  let render

  beforeEach(() => {
    render = (props = {}) => {
      const { calibrationData = null, calibratedThisSession = false } = props
      return mount(
        <CalibrationData
          calibrationData={calibrationData}
          calibratedThisSession={calibratedThisSession}
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
      calibratedThisSession: false,
    })
    expect(wrapper.text().includes('Existing data')).toBe(true)
  })

  it('displays updated data if calibrated in this session', () => {
    const wrapper = render({
      calibrationData: { x: 1, y: 2, z: 0 },
      calibratedThisSession: true,
    })
    expect(wrapper.text().includes('Updated data')).toBe(true)
  })

  it('displays updated data if calibrated in this session with same data', () => {
    const wrapper = render({
      calibrationData: { x: 1, y: 0, z: 0 },
      calibratedThisSession: true,
    })
    expect(wrapper.text().includes('Updated data')).toBe(true)
  })
})
