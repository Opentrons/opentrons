import { when } from 'vitest-when'
import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { i18n } from '/app/i18n'
import { CalibrationStatusCard } from '../..//CalibrationStatusCard'
import { useFeatureFlag } from '/app/redux/config'
import * as RobotApi from '/app/redux/robot-api'
import { renderWithProviders } from '/app/__testing-utils__'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
  mockPipetteOffsetCalibration3,
} from '/app/redux/calibration/pipette-offset/__fixtures__'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import {
  mockAttachedPipette,
  mockAttachedPipetteInformation,
} from '/app/redux/pipettes/__fixtures__'
import { usePipetteOffsetCalibrations } from '/app/organisms/Desktop/Devices/hooks'
import {
  useAttachedPipettes,
  useAttachedPipettesFromInstrumentsQuery,
} from '/app/resources/instruments'
import { useRobot, useIsFlex } from '/app/redux-resources/robots'
import { useRunStatuses } from '/app/resources/runs'

import { CalibrationDataDownload } from '../CalibrationDataDownload'
import { CalibrationHealthCheck } from '../CalibrationHealthCheck'
import { RobotSettingsDeckCalibration } from '../RobotSettingsDeckCalibration'
import { RobotSettingsGripperCalibration } from '../RobotSettingsGripperCalibration'
import { RobotSettingsPipetteOffsetCalibration } from '../RobotSettingsPipetteOffsetCalibration'
import { RobotSettingsTipLengthCalibration } from '../RobotSettingsTipLengthCalibration'
import { RobotSettingsModuleCalibration } from '../RobotSettingsModuleCalibration'
import { RobotSettingsCalibration } from '..'
import type * as ReactApiClient from '@opentrons/react-api-client'
import type { AttachedPipettesByMount } from '/app/redux/pipettes/types'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    useInstrumentsQuery: vi.fn(),
  }
})
vi.mock('../../CalibrationStatusCard')
vi.mock('/app/redux/config')
vi.mock('/app/redux/sessions/selectors')
vi.mock('/app/redux/robot-api/selectors')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/resources/instruments')
vi.mock('/app/organisms/Desktop/Devices/hooks')
vi.mock('/app/resources/runs')
vi.mock('../CalibrationDataDownload')
vi.mock('../CalibrationHealthCheck')
vi.mock('../RobotSettingsDeckCalibration')
vi.mock('../RobotSettingsGripperCalibration')
vi.mock('../RobotSettingsPipetteOffsetCalibration')
vi.mock('../RobotSettingsTipLengthCalibration')
vi.mock('../RobotSettingsModuleCalibration')
vi.mock('/app/organisms/Desktop/CalibrationError')

const mockAttachedPipettes: AttachedPipettesByMount = {
  left: mockAttachedPipette,
  right: mockAttachedPipette,
} as any

const RUN_STATUSES = {
  isRunRunning: false,
  isRunStill: false,
  isRunTerminal: false,
  isRunIdle: false,
}

const mockUpdateRobotStatus = vi.fn()

const render = () => {
  return renderWithProviders(
    <RobotSettingsCalibration
      robotName="otie"
      updateRobotStatus={mockUpdateRobotStatus}
    />,
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
    vi.mocked(usePipetteOffsetCalibrations).mockReturnValue([
      mockPipetteOffsetCalibration1,
      mockPipetteOffsetCalibration2,
      mockPipetteOffsetCalibration3,
    ])
    vi.mocked(useRobot).mockReturnValue(mockConnectableRobot)
    vi.mocked(useAttachedPipettes).mockReturnValue(mockAttachedPipettes)
    vi.mocked(useRunStatuses).mockReturnValue(RUN_STATUSES)
    vi.mocked(getRequestById).mockReturnValue(null)
    when(useIsFlex).calledWith('otie').thenReturn(false)
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    vi.mocked(CalibrationStatusCard).mockReturnValue(
      <div>Mock CalibrationStatusCard</div>
    )
    vi.mocked(CalibrationDataDownload).mockReturnValue(
      <div>Mock CalibrationDataDownload</div>
    )
    vi.mocked(CalibrationHealthCheck).mockReturnValue(
      <div>Mock CalibrationHealthCheck</div>
    )
    vi.mocked(RobotSettingsDeckCalibration).mockReturnValue(
      <div>Mock RobotSettingsDeckCalibration</div>
    )
    vi.mocked(RobotSettingsGripperCalibration).mockReturnValue(
      <div>Mock RobotSettingsGripperCalibration</div>
    )
    vi.mocked(RobotSettingsPipetteOffsetCalibration).mockReturnValue(
      <div>Mock RobotSettingsPipetteOffsetCalibration</div>
    )
    vi.mocked(RobotSettingsTipLengthCalibration).mockReturnValue(
      <div>Mock RobotSettingsTipLengthCalibration</div>
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

  it('renders a Calibration Status component when the calibration wizard feature flag is set', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    render()
    screen.getByText('Mock CalibrationStatusCard')
  })

  it('renders a Deck Calibration component for an OT-2', () => {
    render()
    screen.getByText('Mock RobotSettingsDeckCalibration')
  })

  it('does not render a Deck Calibration component for a Flex', () => {
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    expect(screen.queryByText('Mock RobotSettingsDeckCalibration')).toBeNull()
  })

  it('renders a Pipette Offset Calibration component', () => {
    render()
    screen.getByText('Mock RobotSettingsPipetteOffsetCalibration')
  })

  it('renders a Tip Length Calibration component for an OT-2', () => {
    render()
    screen.getByText('Mock RobotSettingsTipLengthCalibration')
  })

  it('does not render a Tip Length Calibration component for a Flex', () => {
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    expect(
      screen.queryByText('Mock RobotSettingsTipLengthCalibration')
    ).toBeNull()
  })

  it('renders a Calibration Health Check component for an OT-2', () => {
    render()
    screen.getByText('Mock CalibrationHealthCheck')
  })

  it('does not render a Calibration Health Check component for a Flex', () => {
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    expect(screen.queryByText('Mock CalibrationHealthCheck')).toBeNull()
  })

  it('renders a Gripper Calibration component for a Flex', () => {
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    screen.getByText('Mock RobotSettingsGripperCalibration')
  })

  it('does not render a Gripper Calibration component for an OT-2', () => {
    render()
    expect(
      screen.queryByText('Mock RobotSettingsGripperCalibration')
    ).toBeNull()
  })

  it('does not render the OT-2 components when there is a Flex attached with pipettes', () => {
    vi.mocked(useAttachedPipettesFromInstrumentsQuery).mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    expect(screen.queryByText('Mock RobotSettingsDeckCalibration')).toBeNull()
    expect(
      screen.queryByText('Mock RobotSettingsTipLengthCalibration')
    ).toBeNull()
    expect(screen.queryByText('Mock CalibrationHealthCheck')).toBeNull()
  })

  it('renders the correct calibration data for a Flex pipette', () => {
    vi.mocked(useAttachedPipettesFromInstrumentsQuery).mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    screen.getByText('Mock RobotSettingsPipetteOffsetCalibration')
  })

  it('render a Module Calibration component for a Flex and module calibration feature flag is on', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    screen.getByText('Mock RobotSettingsModuleCalibration')
  })
})
