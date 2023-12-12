import * as React from 'react'

import { fireEvent, screen } from '@testing-library/react'
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
    render(props)
    screen.getByText('Gripper Calibration')
    screen.getByText(
      `Gripper calibration uses a metal pin to determine the gripper's exact position relative to precision-cut squares on deck slots.`
    )
    screen.getByText('Gripper Serial')
    screen.getByText('Last Calibrated')
  })
  it('renders last calibrated date and recalibrate button if calibration data exists', () => {
    render(props)
    screen.getByText('mockSerial123')
    screen.getByText('last calibrated 1/2/3')
    const overflowButton = screen.getByRole('button', {
      name: 'CalibrationOverflowMenu_button_gripperCalibration',
    })
    fireEvent.click(overflowButton)
    screen.getByText('Recalibrate gripper')
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

    render(props)
    screen.getByText('mockSerial123')
    screen.getByText('Not calibrated')
    const overflowButton = screen.getByRole('button', {
      name: 'CalibrationOverflowMenu_button_gripperCalibration',
    })
    fireEvent.click(overflowButton)
    screen.getByText('Calibrate gripper')
  })
  it('renders gripper wizard flows when calibrate is pressed', () => {
    render(props)
    const overflowButton = screen.getByRole('button', {
      name: 'CalibrationOverflowMenu_button_gripperCalibration',
    })
    fireEvent.click(overflowButton)
    const calibrateButton = screen.getByText('Calibrate gripper')
    calibrateButton.click()
    screen.getByText('Mock Wizard Flow')
  })

  it('render text when gripper is not attached instead calibration data', () => {
    props = {
      gripper: null as any,
    }
    render(props)
    screen.getByText('No gripper attached')
  })
})
