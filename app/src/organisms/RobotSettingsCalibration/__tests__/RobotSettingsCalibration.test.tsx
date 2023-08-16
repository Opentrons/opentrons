import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { CalibrationStatusCard } from '../../../organisms/CalibrationStatusCard'
import { useFeatureFlag } from '../../../redux/config'
import * as RobotApi from '../../../redux/robot-api'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
  mockPipetteOffsetCalibration3,
} from '../../../redux/calibration/pipette-offset/__fixtures__'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import {
  mockAttachedPipette,
  mockAttachedPipetteInformation,
} from '../../../redux/pipettes/__fixtures__'
import {
  useIsOT3,
  usePipetteOffsetCalibrations,
  useRobot,
  useAttachedPipettes,
  useRunStatuses,
  useAttachedPipettesFromInstrumentsQuery,
} from '../../../organisms/Devices/hooks'

import { CalibrationDataDownload } from '../CalibrationDataDownload'
import { CalibrationHealthCheck } from '../CalibrationHealthCheck'
import { RobotSettingsDeckCalibration } from '../RobotSettingsDeckCalibration'
import { RobotSettingsGripperCalibration } from '../RobotSettingsGripperCalibration'
import { RobotSettingsPipetteOffsetCalibration } from '../RobotSettingsPipetteOffsetCalibration'
import { RobotSettingsTipLengthCalibration } from '../RobotSettingsTipLengthCalibration'
import { RobotSettingsCalibration } from '..'

import type { AttachedPipettesByMount } from '../../../redux/pipettes/types'

jest.mock('@opentrons/react-api-client/src/instruments/useInstrumentsQuery')
jest.mock('../../../organisms/CalibrationStatusCard')
jest.mock('../../../redux/config')
jest.mock('../../../redux/sessions/selectors')
jest.mock('../../../redux/robot-api/selectors')
jest.mock('../../../organisms/Devices/hooks')
jest.mock('../CalibrationDataDownload')
jest.mock('../CalibrationHealthCheck')
jest.mock('../RobotSettingsDeckCalibration')
jest.mock('../RobotSettingsGripperCalibration')
jest.mock('../RobotSettingsPipetteOffsetCalibration')
jest.mock('../RobotSettingsTipLengthCalibration')

const mockAttachedPipettes: AttachedPipettesByMount = {
  left: mockAttachedPipette,
  right: mockAttachedPipette,
} as any
const mockUsePipetteOffsetCalibrations = usePipetteOffsetCalibrations as jest.MockedFunction<
  typeof usePipetteOffsetCalibrations
>
const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
const mockCalibrationStatusCard = CalibrationStatusCard as jest.MockedFunction<
  typeof CalibrationStatusCard
>
const mockCalibrationDataDownload = CalibrationDataDownload as jest.MockedFunction<
  typeof CalibrationDataDownload
>
const mockCalibrationHealthCheck = CalibrationHealthCheck as jest.MockedFunction<
  typeof CalibrationHealthCheck
>
const mockRobotSettingsDeckCalibration = RobotSettingsDeckCalibration as jest.MockedFunction<
  typeof RobotSettingsDeckCalibration
>
const mockRobotSettingsGripperCalibration = RobotSettingsGripperCalibration as jest.MockedFunction<
  typeof RobotSettingsGripperCalibration
>
const mockRobotSettingsPipetteOffsetCalibration = RobotSettingsPipetteOffsetCalibration as jest.MockedFunction<
  typeof RobotSettingsPipetteOffsetCalibration
>
const mockRobotSettingsTipLengthCalibration = RobotSettingsTipLengthCalibration as jest.MockedFunction<
  typeof RobotSettingsTipLengthCalibration
>
const mockUseAttachedPipettesFromInstrumentsQuery = useAttachedPipettesFromInstrumentsQuery as jest.MockedFunction<
  typeof useAttachedPipettesFromInstrumentsQuery
>
const mockUseIsOT3 = useIsOT3 as jest.MockedFunction<typeof useIsOT3>

const RUN_STATUSES = {
  isRunRunning: false,
  isRunStill: false,
  isRunTerminal: false,
  isRunIdle: false,
}

const mockUpdateRobotStatus = jest.fn()

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

describe('RobotSettingsCalibration', () => {
  beforeEach(() => {
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: null,
      right: null,
    })
    mockUseInstrumentsQuery.mockReturnValue({
      data: {
        data: [
          {
            ok: true,
            instrumentType: 'gripper',
          } as any,
        ],
      },
    } as any)
    mockUsePipetteOffsetCalibrations.mockReturnValue([
      mockPipetteOffsetCalibration1,
      mockPipetteOffsetCalibration2,
      mockPipetteOffsetCalibration3,
    ])
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockUseAttachedPipettes.mockReturnValue(mockAttachedPipettes)
    mockUseRunStatuses.mockReturnValue(RUN_STATUSES)
    mockGetRequestById.mockReturnValue(null)
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(false)
    mockUseFeatureFlag.mockReturnValue(false)
    mockCalibrationStatusCard.mockReturnValue(
      <div>Mock CalibrationStatusCard</div>
    )
    mockCalibrationDataDownload.mockReturnValue(
      <div>Mock CalibrationDataDownload</div>
    )
    mockCalibrationHealthCheck.mockReturnValue(
      <div>Mock CalibrationHealthCheck</div>
    )
    mockRobotSettingsDeckCalibration.mockReturnValue(
      <div>Mock RobotSettingsDeckCalibration</div>
    )
    mockRobotSettingsGripperCalibration.mockReturnValue(
      <div>Mock RobotSettingsGripperCalibration</div>
    )
    mockRobotSettingsPipetteOffsetCalibration.mockReturnValue(
      <div>Mock RobotSettingsPipetteOffsetCalibration</div>
    )
    mockRobotSettingsTipLengthCalibration.mockReturnValue(
      <div>Mock RobotSettingsTipLengthCalibration</div>
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders a Calibration Data Download component', () => {
    const [{ getByText }] = render()
    getByText('Mock CalibrationDataDownload')
  })

  it('renders a Calibration Data Download component when the calibration wizard feature flag is set', () => {
    mockUseFeatureFlag.mockReturnValue(true)
    const [{ getByText }] = render()
    getByText('Mock CalibrationDataDownload')
  })

  it('renders a Calibration Status component when the calibration wizard feature flag is set', () => {
    mockUseFeatureFlag.mockReturnValue(true)
    const [{ getByText }] = render()
    getByText('Mock CalibrationStatusCard')
  })

  it('renders a Deck Calibration component for an OT-2', () => {
    const [{ getByText }] = render()
    getByText('Mock RobotSettingsDeckCalibration')
  })

  it('does not render a Deck Calibration component for an OT-3', () => {
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    const [{ queryByText }] = render()
    expect(queryByText('Mock RobotSettingsDeckCalibration')).toBeNull()
  })

  it('renders a Pipette Offset Calibration component', () => {
    const [{ getByText }] = render()
    getByText('Mock RobotSettingsPipetteOffsetCalibration')
  })

  it('renders a Tip Length Calibration component for an OT-2', () => {
    const [{ getByText }] = render()
    getByText('Mock RobotSettingsTipLengthCalibration')
  })

  it('does not render a Tip Length Calibration component for an OT-3', () => {
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    const [{ queryByText }] = render()
    expect(queryByText('Mock RobotSettingsTipLengthCalibration')).toBeNull()
  })

  it('renders a Calibration Health Check component for an OT-2', () => {
    const [{ getByText }] = render()
    getByText('Mock CalibrationHealthCheck')
  })

  it('does not render a Calibration Health Check component for an OT-3', () => {
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    const [{ queryByText }] = render()
    expect(queryByText('Mock CalibrationHealthCheck')).toBeNull()
  })

  it('renders a Gripper Calibration component for an OT-3', () => {
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    const [{ getByText }] = render()
    getByText('Mock RobotSettingsGripperCalibration')
  })

  it('does not render a Gripper Calibration component for an OT-2', () => {
    const [{ queryByText }] = render()
    expect(queryByText('Mock RobotSettingsGripperCalibration')).toBeNull()
  })

  it('does not render the OT-2 components when there is an OT-3 attached with pipettes', () => {
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    const [{ queryByText }] = render()
    expect(queryByText('Mock RobotSettingsDeckCalibration')).toBeNull()
    expect(queryByText('Mock RobotSettingsTipLengthCalibration')).toBeNull()
    expect(queryByText('Mock CalibrationHealthCheck')).toBeNull()
  })

  it('renders the correct calibration data for an OT-3 pipette', () => {
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    const [{ getByText }] = render()
    getByText('Mock RobotSettingsPipetteOffsetCalibration')
  })
})
