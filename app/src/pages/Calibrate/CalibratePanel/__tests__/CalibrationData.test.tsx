import * as React from 'react'
import { mountWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { CalibrationData } from '../CalibrationData'

import type { WrapperWithStore } from '@opentrons/components'

describe('CalibrationData', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof CalibrationData>>
  ) => WrapperWithStore<React.ComponentProps<typeof CalibrationData>>

  beforeEach(() => {
    render = (props = {}) => {
      const {
        calibrationData = null,
        calibratedThisSession = false,
        calDataAvailable = true,
      } = props
      return mountWithProviders(
        <CalibrationData
          calibrationData={calibrationData}
          calibratedThisSession={calibratedThisSession}
          calDataAvailable={calDataAvailable}
        />,
        { i18n }
      )
    }
  })

  it('displays not calibrated if no existing data and not calibrated in this session', () => {
    const { wrapper } = render()
    expect(wrapper.text().includes('Not yet calibrated')).toBe(true)
  })

  it('displays existing data if present and not calibrated in this session', () => {
    const { wrapper } = render({
      calibrationData: { x: 1, y: 0, z: 0 },
      calibratedThisSession: false,
    })
    expect(wrapper.text().includes('Existing data')).toBe(true)
  })

  it('displays updated data if calibrated in this session', () => {
    const { wrapper } = render({
      calibrationData: { x: 1, y: 2, z: 0 },
      calibratedThisSession: true,
    })
    expect(wrapper.text().includes('Updated data')).toBe(true)
  })

  it('displays updated data if calibrated in this session with same data', () => {
    const { wrapper } = render({
      calibrationData: { x: 1, y: 0, z: 0 },
      calibratedThisSession: true,
    })
    expect(wrapper.text().includes('Updated data')).toBe(true)
  })

  it('displays calibration data n/a when labware is calDataAvailable', () => {
    const { wrapper } = render({
      calDataAvailable: false,
    })
    expect(wrapper.text().includes('Calibration Data N/A')).toBe(true)
  })
})
