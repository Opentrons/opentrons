import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { ModuleCalibrationOverflowMenu } from '../ModuleCalibrationOverflowMenu'

const render = (
  props: React.ComponentProps<typeof ModuleCalibrationOverflowMenu>
) => {
  return renderWithProviders(<ModuleCalibrationOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ModuleCalibrationOverflowMenu', () => {
  let props: React.ComponentProps<typeof ModuleCalibrationOverflowMenu>

  beforeEach(() => {
    props = {
      isCalibrated: false,
      updateRobotStatus: jest.fn(),
    }
  })

  it('should render overflow menu buttons - not calibrated', () => {
    const [{ getByText, queryByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Calibrate module')
    expect(queryByText('Clear calibration data')).not.toBeInTheDocument()
  })

  it('should render overflow menu buttons - calibrated', () => {
    props = { ...props, isCalibrated: true }
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Recalibrate module')
    getByText('Clear calibration data')
  })
})
