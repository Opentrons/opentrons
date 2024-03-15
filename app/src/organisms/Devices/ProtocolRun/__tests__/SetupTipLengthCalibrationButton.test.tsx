import * as React from 'react'
import { when } from 'vitest-when'
import { screen, fireEvent } from '@testing-library/react'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'

import { fixtureTiprack300ul } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { mockTipLengthCalLauncher } from '../../hooks/__fixtures__/taskListFixtures'
import { useDeckCalibrationData, useRunHasStarted } from '../../hooks'
import { useDashboardCalibrateTipLength } from '../../../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibrateTipLength'
import { SetupTipLengthCalibrationButton } from '../SetupTipLengthCalibrationButton'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('@opentrons/components/src/hooks')
vi.mock('../../../../organisms/RunTimeControl/hooks')
vi.mock(
  '../../../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibrateTipLength'
)
vi.mock('../../../../redux/config')
vi.mock('../../../../redux/sessions/selectors')
vi.mock('../../hooks')

const ROBOT_NAME = 'otie'
const RUN_ID = '1'

describe('SetupTipLengthCalibrationButton', () => {
  const render = ({
    mount = 'left',
    disabled = false,
    robotName = ROBOT_NAME,
    runId = RUN_ID,
    hasCalibrated = false,
    tipRackDefinition = fixtureTiprack300ul as LabwareDefinition2,
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
    when(vi.mocked(useRunHasStarted)).calledWith(RUN_ID).thenReturn(false)
    when(vi.mocked(useDeckCalibrationData)).calledWith(ROBOT_NAME).thenReturn({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: true,
    })
    vi.mocked(useDashboardCalibrateTipLength).mockReturnValue([
      mockTipLengthCalLauncher,
      null,
    ])
  })

  afterEach(() => {
    vi.resetAllMocks()
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
    when(vi.mocked(useRunHasStarted)).calledWith(RUN_ID).thenReturn(true)
    render({ hasCalibrated: true })
    const recalibrate = screen.getByText('Recalibrate')
    fireEvent.click(recalibrate)
    expect(mockTipLengthCalLauncher).not.toBeCalled()
  })
})
