import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { GripperWizardFlows } from '../../../organisms/GripperWizardFlows'
import { formatLastCalibrated } from '../CalibrationDetails/utils'
import { RobotSettingsGripperCalibration } from '../RobotSettingsGripperCalibration'
import type { GripperData } from '@opentrons/api-client'
import type { RobotSettingsGripperCalibrationProps } from '../RobotSettingsGripperCalibration'
jest.mock('../../../organisms/GripperWizardFlows')
jest.mock('../CalibrationDetails/utils')

const mockGripperWizardFlows = GripperWizardFlows as jest.MockedFunction<
  typeof GripperWizardFlows
>
const mockFormatLastCalibrated = formatLastCalibrated as jest.MockedFunction<
  typeof formatLastCalibrated
>

let props = {
  gripper: {
    serialNumber: 'mockSerial123',
    data: {
      calibratedOffset: {
        last_modified: '12345',
      },
    },
  } as GripperData,
}

const render = (props: RobotSettingsGripperCalibrationProps) => {
  return renderWithProviders(<RobotSettingsGripperCalibration {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RobotSettingsGripperCalibration', () => {
  beforeEach(() => {
    mockFormatLastCalibrated.mockReturnValue('last calibrated 1/2/3')
    mockGripperWizardFlows.mockReturnValue(<>Mock Wizard Flow</>)
  })
  it('renders a title and description - Gripper Calibration section', () => {
    const [{ getByText }] = render(props)
    getByText('Gripper Calibration')
    getByText(
      `Gripper calibration uses a metal pin to determine the gripper's exact position relative to precision-cut squares on deck slots.`
    )
    getByText('Gripper Serial')
    getByText('Last Calibrated')
  })
  it('renders last calibrated date and recalibrate button if calibration data exists', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('mockSerial123')
    getByText('last calibrated 1/2/3')
    const overflowButton = getByRole('button', {
      name: 'CalibrationOverflowMenu_button_gripperCalibration',
    })
    overflowButton.click()
    getByText('Recalibrate gripper')
  })
  it('renders not calibrated and calibrate button if calibration data does not exist', () => {
    props = {
      gripper: {
        serialNumber: 'mockSerial123',
        data: {
          calibratedOffset: {
            last_modified: undefined,
          },
        },
      } as GripperData,
    }

    const [{ getByText, getByRole }] = render(props)
    getByText('mockSerial123')
    getByText('Not calibrated')
    const overflowButton = getByRole('button', {
      name: 'CalibrationOverflowMenu_button_gripperCalibration',
    })
    overflowButton.click()
    getByText('Calibrate gripper')
  })
  it('renders gripper wizard flows when calibrate is pressed', () => {
    const [{ getByText, getByRole }] = render(props)
    const overflowButton = getByRole('button', {
      name: 'CalibrationOverflowMenu_button_gripperCalibration',
    })
    overflowButton.click()
    const calibrateButton = getByText('Calibrate gripper')
    calibrateButton.click()
    getByText('Mock Wizard Flow')
  })
})
