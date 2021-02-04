// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { TipLengthCalibrationData } from '../TipLengthCalibrationData'

describe('TipLengthCalibrationData', () => {
  let render

  beforeEach(() => {
    render = (props = {}) => {
      const { calibrationData = null, calDataAvailable = true } = props
      return mount(
        <TipLengthCalibrationData
          calibrationData={calibrationData}
          calDataAvailable={calDataAvailable}
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
      calibrationData: {
        id: '1',
        tipLength: 30,
        tiprack: 'tiprack',
        pipette: 'pip',
        lastModified: 'time',
        source: 'user',
        status: {
          markedBad: false,
          source: 'unknown',
          markedAt: '',
        },
      },
    })
    expect(wrapper.text().includes('Existing data')).toBe(true)
  })

  it('displays calibration data n/a when labware is calDataAvailable', () => {
    const wrapper = render({
      calDataAvailable: false,
    })
    expect(wrapper.text().includes('Calibration Data N/A')).toBe(true)
  })
})
