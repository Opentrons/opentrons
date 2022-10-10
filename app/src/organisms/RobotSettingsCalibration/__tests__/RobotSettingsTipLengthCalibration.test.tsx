import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useFeatureFlag } from '../../../redux/config'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
  mockTipLengthCalibration3,
} from '../../../redux/calibration/tip-length/__fixtures__'
import { useTipLengthCalibrations } from '../../../organisms/Devices/hooks'

import { RobotSettingsTipLengthCalibration } from '../RobotSettingsTipLengthCalibration'
import { TipLengthCalibrationItems } from '../CalibrationDetails/TipLengthCalibrationItems'

import type { FormattedPipetteOffsetCalibration } from '..'

jest.mock('../../../redux/config')
jest.mock('../../../organisms/Devices/hooks')
jest.mock('../CalibrationDetails/TipLengthCalibrationItems')

const mockUseTipLengthCalibrations = useTipLengthCalibrations as jest.MockedFunction<
  typeof useTipLengthCalibrations
>
const mockTipLengthCalibrationItems = TipLengthCalibrationItems as jest.MockedFunction<
  typeof TipLengthCalibrationItems
>
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>

const mockFormattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[] = []

const mockUpdateRobotStatus = jest.fn()

const render = () => {
  return renderWithProviders(
    <RobotSettingsTipLengthCalibration
      formattedPipetteOffsetCalibrations={
        mockFormattedPipetteOffsetCalibrations
      }
      robotName="otie"
      updateRobotStatus={mockUpdateRobotStatus}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettingsTipLengthCalibration', () => {
  beforeEach(() => {
    mockUseTipLengthCalibrations.mockReturnValue([
      mockTipLengthCalibration1,
      mockTipLengthCalibration2,
      mockTipLengthCalibration3,
    ])
    mockTipLengthCalibrationItems.mockReturnValue(
      <div>Mock TipLengthCalibrationItems</div>
    )
    mockUseFeatureFlag.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a title and description', () => {
    const [{ getByText }] = render()
    getByText('Tip Length Calibrations')
    getByText(
      'Tip length calibration measures the distance between the bottom of the tip and the pipette’s nozzle. You can recalibrate a tip length if the pipette associated with it is currently attached to this robot. If you recalibrate a tip length, you will be prompted to recalibrate that pipette’s offset calibration.'
    )
    getByText('Mock TipLengthCalibrationItems')
  })

  it('renders Not calibrated yet when no tip length calibrations data', () => {
    mockUseTipLengthCalibrations.mockReturnValue(null)
    const [{ getByText }] = render()
    getByText('Not calibrated yet')
  })
})
