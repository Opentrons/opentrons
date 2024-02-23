import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'

import { i18n } from '../../../../i18n'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { mockTipLengthCalLauncher } from '../../hooks/__fixtures__/taskListFixtures'
import { useDeckCalibrationData, useRunHasStarted } from '../../hooks'
import { useDashboardCalibrateTipLength } from '../../../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibrateTipLength'
import { SetupTipLengthCalibrationButton } from '../SetupTipLengthCalibrationButton'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

jest.mock('@opentrons/components/src/hooks')
jest.mock('../../../../organisms/RunTimeControl/hooks')
jest.mock(
  '../../../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibrateTipLength'
)
jest.mock('../../../../redux/config')
jest.mock('../../../../redux/sessions/selectors')
jest.mock('../../hooks')

const mockUseRunHasStarted = useRunHasStarted as jest.MockedFunction<
  typeof useRunHasStarted
>
const mockUseDeckCalibrationData = useDeckCalibrationData as jest.MockedFunction<
  typeof useDeckCalibrationData
>
const mockUseDashboardCalibrateTipLength = useDashboardCalibrateTipLength as jest.MockedFunction<
  typeof useDashboardCalibrateTipLength
>

const ROBOT_NAME = 'otie'
const RUN_ID = '1'

describe('SetupTipLengthCalibrationButton', () => {
  const render = ({
    mount = 'left',
    disabled = false,
    robotName = ROBOT_NAME,
    runId = RUN_ID,
    hasCalibrated = false,
    tipRackDefinition = fixture_tiprack_300_ul as LabwareDefinition2,
    isExtendedPipOffset = false,
  }: Partial<
    React.ComponentProps<typeof SetupTipLengthCalibrationButton>
  > = {}) => {
    return renderWithProviders(
      <SetupTipLengthCalibrationButton
        {...{
          mount,
          disabled,
          robotName,
          runId,
          hasCalibrated,
          tipRackDefinition,
          isExtendedPipOffset,
        }}
      />,
      { i18nInstance: i18n }
    )[0]
  }

  beforeEach(() => {
    when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(false)
    when(mockUseDeckCalibrationData).calledWith(ROBOT_NAME).mockReturnValue({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: true,
    })
    mockUseDashboardCalibrateTipLength.mockReturnValue([
      mockTipLengthCalLauncher,
      null,
    ])
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('renders the calibrate now button if tip length not calibrated', () => {
    render()
    expect(screen.getByRole('button', { name: 'Calibrate now' })).toBeTruthy()
  })

  it('renders the recalibrate link if tip length calibrated and run unstarted', () => {
    render({ hasCalibrated: true })
    expect(screen.getByText('Recalibrate')).toBeTruthy()
  })

  it('button launches the tip length calibration wizard when clicked - no calibration', () => {
    render()
    const calibrateBtn = screen.getByText('Calibrate now')
    fireEvent.click(calibrateBtn)
    expect(mockTipLengthCalLauncher).toHaveBeenCalled()
  })

  it('button launches the tip length calibration wizard when clicked - recalibration', () => {
    const { getByText } = render({ hasCalibrated: true })
    const recalibrateBtn = getByText('Recalibrate')
    fireEvent.click(recalibrateBtn)
    expect(mockTipLengthCalLauncher).toHaveBeenCalled()
  })

  it('disables the recalibrate link if tip length calibrated and run started', () => {
    when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(true)
    render({ hasCalibrated: true })
    const recalibrate = screen.getByText('Recalibrate')
    fireEvent.click(recalibrate)
    expect(mockTipLengthCalLauncher).not.toBeCalled()
  })
})
