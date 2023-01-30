import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
  mockPipetteOffsetCalibration3,
} from '../../../redux/calibration/pipette-offset/__fixtures__'
import { useFeatureFlag } from '../../../redux/config'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import {
  useIsOT3,
  usePipetteOffsetCalibrations,
  useRobot,
} from '../../../organisms/Devices/hooks'

import { RobotSettingsPipetteOffsetCalibration } from '../RobotSettingsPipetteOffsetCalibration'
import { PipetteOffsetCalibrationItems } from '../CalibrationDetails/PipetteOffsetCalibrationItems'

import type { FormattedPipetteOffsetCalibration } from '..'

jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../redux/config')
jest.mock('../CalibrationDetails/PipetteOffsetCalibrationItems')

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
const mockUseIsOT3 = useIsOT3 as jest.MockedFunction<typeof useIsOT3>
const mockUsePipetteOffsetCalibrations = usePipetteOffsetCalibrations as jest.MockedFunction<
  typeof usePipetteOffsetCalibrations
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockPipetteOffsetCalibrationItems = PipetteOffsetCalibrationItems as jest.MockedFunction<
  typeof PipetteOffsetCalibrationItems
>

const mockFormattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[] = []
const mockUpdateRobotStatus = jest.fn()

const render = (
  props?: Partial<
    React.ComponentProps<typeof RobotSettingsPipetteOffsetCalibration>
  >
) => {
  return renderWithProviders(
    <RobotSettingsPipetteOffsetCalibration
      formattedPipetteOffsetCalibrations={
        mockFormattedPipetteOffsetCalibrations
      }
      pipetteOffsetCalBannerType="''"
      robotName="otie"
      showPipetteOffsetCalibrationBanner={false}
      updateRobotStatus={mockUpdateRobotStatus}
      {...props}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettingsPipetteOffsetCalibration', () => {
  beforeEach(() => {
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(false)
    mockUsePipetteOffsetCalibrations.mockReturnValue([
      mockPipetteOffsetCalibration1,
      mockPipetteOffsetCalibration2,
      mockPipetteOffsetCalibration3,
    ])
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockPipetteOffsetCalibrationItems.mockReturnValue(
      <div>PipetteOffsetCalibrationItems</div>
    )
    when(mockUseFeatureFlag)
      .calledWith('enableCalibrationWizards')
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders a title and description - Pipette Offset Calibrations', () => {
    const [{ getByText }] = render()
    getByText('Pipette Offset Calibrations')
    getByText(
      'Pipette offset calibration measures a pipette’s position relative to the pipette mount and the deck. You can recalibrate a pipette’s offset if its currently attached to this robot.'
    )
    getByText('PipetteOffsetCalibrationItems')
  })

  it('renders an OT-3 title and description - Pipette Calibrations', () => {
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    const [{ getByText }] = render()
    getByText('Pipette Calibrations')
    getByText(
      `Pipette calibration uses a metal probe to determine the pipette's exact position relative to precision-cut divots on deck slots.`
    )
    getByText('PipetteOffsetCalibrationItems')
  })

  it('renders Not calibrated yet when no pipette offset calibrations data', () => {
    mockUsePipetteOffsetCalibrations.mockReturnValue(null)
    const [{ getByText }] = render()
    getByText('Not calibrated yet')
  })

  it('renders the error banner when error props provided', () => {
    const [{ getByText }] = render({
      showPipetteOffsetCalibrationBanner: true,
      pipetteOffsetCalBannerType: 'error',
    })
    getByText('Pipette Offset calibration missing')
  })

  it('does not render the error banner when error props provided and when the calibration wizard feature flag is set', () => {
    when(mockUseFeatureFlag)
      .calledWith('enableCalibrationWizards')
      .mockReturnValue(true)
    const [{ queryByText }] = render({
      showPipetteOffsetCalibrationBanner: true,
      pipetteOffsetCalBannerType: 'error',
    })
    expect(
      queryByText('Pipette Offset calibration missing')
    ).not.toBeInTheDocument()
  })

  it('renders the warning banner when warning props provided', () => {
    const [{ getByText }] = render({
      showPipetteOffsetCalibrationBanner: true,
      pipetteOffsetCalBannerType: 'warning',
    })
    getByText('Pipette Offset calibration recommended')
  })

  it('does not render the warning banner when warning props provided and when the calibration wizard feature flag is set', () => {
    when(mockUseFeatureFlag)
      .calledWith('enableCalibrationWizards')
      .mockReturnValue(true)
    const [{ queryByText }] = render({
      showPipetteOffsetCalibrationBanner: true,
      pipetteOffsetCalBannerType: 'warning',
    })
    expect(
      queryByText('Pipette Offset calibration recommended')
    ).not.toBeInTheDocument()
  })
})
