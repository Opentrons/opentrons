import * as React from 'react'
import { mountWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { TipLengthCalibrationData } from '../TipLengthCalibrationData'

import type { WrapperWithStore } from '@opentrons/components'

describe('TipLengthCalibrationData', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof TipLengthCalibrationData>>
  ) => WrapperWithStore<React.ComponentProps<typeof TipLengthCalibrationData>>

  beforeEach(() => {
    render = (props = {}) => {
      const { calibrationData = null, calDataAvailable = true } = props
      return mountWithProviders(
        <TipLengthCalibrationData
          calibrationData={calibrationData}
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
    const { wrapper } = render({
      calDataAvailable: false,
    })
    expect(wrapper.text().includes('Calibration Data N/A')).toBe(true)
  })
})
