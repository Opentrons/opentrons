import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useFeatureFlag } from '../../../redux/config'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
  mockTipLengthCalibration3,
} from '../../../redux/calibration/tip-length/__fixtures__'
import { mockAttachedPipette } from '../../../redux/pipettes/__fixtures__'
import {
  useAttachedPipettes,
  useTipLengthCalibrations,
} from '../../../organisms/Devices/hooks'

import { RobotSettingsTipLengthCalibration } from '../RobotSettingsTipLengthCalibration'
import { TipLengthCalibrationItems } from '../CalibrationDetails/TipLengthCalibrationItems'

import type { FormattedPipetteOffsetCalibration } from '..'
import type { AttachedPipettesByMount } from '../../../redux/pipettes/types'

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
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
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
    mockUseAttachedPipettes.mockReturnValue({
      left: mockAttachedPipette,
      right: null,
    } as AttachedPipettesByMount)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a title', () => {
    const [{ getByText }] = render()
    getByText('Tip Length Calibrations')
    getByText('Mock TipLengthCalibrationItems')
  })
})
