import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTipLengthCalibrations } from '/app/organisms/Desktop/Devices/hooks'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
  mockTipLengthCalibration3,
} from '/app/redux/calibration/tip-length/__fixtures__'
import { useFeatureFlag } from '/app/redux/config'
import { useAttachedPipettes } from '/app/resources/instruments'
import { mockAttachedPipette } from '/app/resources/instruments/__fixtures__'

import { TipLengthCalibrationItems } from '../CalibrationDetails/TipLengthCalibrationItems'
import { RobotSettingsTipLengthCalibration } from '../RobotSettingsTipLengthCalibration'

import type { AttachedPipettesByMount } from '@opentrons/api-client'
import type { FormattedPipetteOffsetCalibration } from '..'

vi.mock('/app/redux/config')
vi.mock('/app/organisms/Desktop/Devices/hooks')
vi.mock('../CalibrationDetails/TipLengthCalibrationItems')
vi.mock('/app/resources/instruments')

const mockFormattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[] =
  []

const render = () => {
  return renderWithProviders(
    <RobotSettingsTipLengthCalibration
      formattedPipetteOffsetCalibrations={
        mockFormattedPipetteOffsetCalibrations
      }
      robotName="otie"
      isRobotBusy={false}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettingsTipLengthCalibration', () => {
  beforeEach(() => {
    vi.mocked(useTipLengthCalibrations).mockReturnValue([
      mockTipLengthCalibration1,
      mockTipLengthCalibration2,
      mockTipLengthCalibration3,
    ])
    vi.mocked(TipLengthCalibrationItems).mockReturnValue(
      <div>Mock TipLengthCalibrationItems</div>
    )
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    vi.mocked(useAttachedPipettes).mockReturnValue({
      left: mockAttachedPipette,
      right: null,
    } as AttachedPipettesByMount)
  })

  it('renders a title', () => {
    render()
    screen.getByText('Tip Length Calibrations')
    screen.getByText('Mock TipLengthCalibrationItems')
  })
})
