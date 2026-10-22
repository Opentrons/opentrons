import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'
import { when } from 'vitest-when'

import '@testing-library/jest-dom/vitest'

import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useIsFlex, useRobot } from '/app/redux-resources/robots'
import { useFeatureFlag } from '/app/redux/config'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import * as RobotApi from '/app/redux/robot-api'
import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'
import { mockAttachedPipetteInformation } from '/app/resources/instruments/__fixtures__'
import { useRunStatuses } from '/app/resources/runs'

import { RobotSettingsCalibration } from '..'
import { CalibrationDataDownload } from '../CalibrationDataDownload'
import { RobotSettingsGripperCalibration } from '../RobotSettingsGripperCalibration'
import { RobotSettingsModuleCalibration } from '../RobotSettingsModuleCalibration'
import { RobotSettingsPipetteOffsetCalibration } from '../RobotSettingsPipetteOffsetCalibration'

import type * as ReactApiClient from '@opentrons/react-api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    useInstrumentsQuery: vi.fn(),
  }
})
vi.mock('/app/redux/config')
vi.mock('/app/redux/robot-api/selectors')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/resources/instruments')
vi.mock('/app/organisms/Desktop/Devices/hooks')
vi.mock('/app/resources/runs')
vi.mock('../CalibrationDataDownload')
vi.mock('../RobotSettingsGripperCalibration')
vi.mock('../RobotSettingsPipetteOffsetCalibration')
vi.mock('../RobotSettingsModuleCalibration')
vi.mock('/app/organisms/Desktop/CalibrationError')

const RUN_STATUSES = {
  isRunRunning: false,
  isRunStill: false,
  isRunTerminal: false,
  isRunIdle: false,
}

const render = () => {
  return renderWithProviders(
    <RobotSettingsCalibration robotName="otie" isRobotBusy={false} />,
    {
      i18nInstance: i18n,
    }
  )
}
const getRequestById = RobotApi.getRequestById

describe('RobotSettingsCalibration', () => {
  beforeEach(() => {
    vi.mocked(useAttachedPipettesFromInstrumentsQuery).mockReturnValue({
      left: null,
      right: null,
    })
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: {
        data: [
          {
            ok: true,
            instrumentType: 'gripper',
          } as any,
        ],
      },
    } as any)
    vi.mocked(useRobot).mockReturnValue(mockConnectableRobot)
    vi.mocked(useRunStatuses).mockReturnValue(RUN_STATUSES)
    vi.mocked(getRequestById).mockReturnValue(null)
    when(useIsFlex).calledWith('otie').thenReturn(false)
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    vi.mocked(CalibrationDataDownload).mockReturnValue(
      <div>Mock CalibrationDataDownload</div>
    )
    vi.mocked(RobotSettingsGripperCalibration).mockReturnValue(
      <div>Mock RobotSettingsGripperCalibration</div>
    )
    vi.mocked(RobotSettingsPipetteOffsetCalibration).mockReturnValue(
      <div>Mock RobotSettingsPipetteOffsetCalibration</div>
    )
    vi.mocked(RobotSettingsModuleCalibration).mockReturnValue(
      <div>Mock RobotSettingsModuleCalibration</div>
    )
  })

  it('renders a Calibration Data Download component', () => {
    render()
    screen.getByText('Mock CalibrationDataDownload')
  })

  it('renders a Calibration Data Download component when the calibration wizard feature flag is set', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    render()
    screen.getByText('Mock CalibrationDataDownload')
  })

  it('renders a Pipette Offset Calibration component', () => {
    render()
    screen.getByText('Mock RobotSettingsPipetteOffsetCalibration')
  })

  it('renders a Gripper Calibration component', () => {
    render()
    screen.getByText('Mock RobotSettingsGripperCalibration')
  })

  it('renders the correct calibration data for a pipette', () => {
    vi.mocked(useAttachedPipettesFromInstrumentsQuery).mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    screen.getByText('Mock RobotSettingsPipetteOffsetCalibration')
  })

  it('render a Module Calibration component', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    screen.getByText('Mock RobotSettingsModuleCalibration')
  })
})
