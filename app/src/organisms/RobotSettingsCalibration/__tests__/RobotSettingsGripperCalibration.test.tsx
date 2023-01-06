import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { RobotSettingsGripperCalibration } from '../RobotSettingsGripperCalibration'

const render = () => {
  return renderWithProviders(<RobotSettingsGripperCalibration />, {
    i18nInstance: i18n,
  })
}

describe('RobotSettingsGripperCalibration', () => {
  it('renders a title and description - Gripper Calibration section', () => {
    const [{ getByText }] = render()
    getByText('Gripper Calibration')
  })
})
