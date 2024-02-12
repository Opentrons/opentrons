import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { getShellUpdateState } from '../../../../redux/shell'
import { useIsFlex, useIsRobotBusy } from '../../hooks'
import {
  DeviceReset,
  DisplayRobotName,
  EnableStatusLight,
  GantryHoming,
  LegacySettings,
  OpenJupyterControl,
  RobotInformation,
  RobotServerVersion,
  ShortTrashBin,
  Troubleshooting,
  UpdateRobotSoftware,
  UsageSettings,
  UseOlderAspirateBehavior,
  UseOlderProtocol,
} from '../AdvancedTab'
import { RobotSettingsAdvanced } from '../RobotSettingsAdvanced'

import { ShellUpdateState } from '../../../../redux/shell/types'

jest.mock('../../../../redux/robot-settings/selectors')
jest.mock('../../../../redux/discovery/selectors')
jest.mock('../../../../redux/shell/update', () => ({
  ...jest.requireActual<{}>('../../../../redux/shell/update'),
  getShellUpdateState: jest.fn(),
}))
jest.mock('../../hooks')
jest.mock('../AdvancedTab/DeviceReset')
jest.mock('../AdvancedTab/DisplayRobotName')
jest.mock('../AdvancedTab/EnableStatusLight')
jest.mock('../AdvancedTab/GantryHoming')
jest.mock('../AdvancedTab/LegacySettings')
jest.mock('../AdvancedTab/OpenJupyterControl')
jest.mock('../AdvancedTab/RobotInformation')
jest.mock('../AdvancedTab/RobotServerVersion')
jest.mock('../AdvancedTab/ShortTrashBin')
jest.mock('../AdvancedTab/Troubleshooting')
jest.mock('../AdvancedTab/UpdateRobotSoftware')
jest.mock('../AdvancedTab/UsageSettings')
jest.mock('../AdvancedTab/UseOlderAspirateBehavior')
jest.mock('../AdvancedTab/UseOlderProtocol')

const mockGetShellUpdateState = getShellUpdateState as jest.MockedFunction<
  typeof getShellUpdateState
>

const mockAboutRobotName = DisplayRobotName as jest.MockedFunction<
  typeof DisplayRobotName
>
const mockGantryHoming = GantryHoming as jest.MockedFunction<
  typeof GantryHoming
>
const mockDeviceReset = DeviceReset as jest.MockedFunction<typeof DeviceReset>
const mockLegacySettings = LegacySettings as jest.MockedFunction<
  typeof LegacySettings
>
const mockOpenJupyterControl = OpenJupyterControl as jest.MockedFunction<
  typeof OpenJupyterControl
>
const mockRobotInformation = RobotInformation as jest.MockedFunction<
  typeof RobotInformation
>
const mockRobotServerVersion = RobotServerVersion as jest.MockedFunction<
  typeof RobotServerVersion
>
const mockShortTrashBin = ShortTrashBin as jest.MockedFunction<
  typeof ShortTrashBin
>
const mockTroubleshooting = Troubleshooting as jest.MockedFunction<
  typeof Troubleshooting
>
const mockUpdateRobotSoftware = UpdateRobotSoftware as jest.MockedFunction<
  typeof UpdateRobotSoftware
>
const mockUsageSettings = UsageSettings as jest.MockedFunction<
  typeof UsageSettings
>
const mockUseOlderAspirateBehavior = UseOlderAspirateBehavior as jest.MockedFunction<
  typeof UseOlderAspirateBehavior
>
const mockUseOlderProtocol = UseOlderProtocol as jest.MockedFunction<
  typeof UseOlderProtocol
>
const mockEnableStatusLight = EnableStatusLight as jest.MockedFunction<
  typeof EnableStatusLight
>
const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>
const mockUseIsRobotBusy = useIsRobotBusy as jest.MockedFunction<
  typeof useIsRobotBusy
>

const mockUpdateRobotStatus = jest.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotSettingsAdvanced
        robotName="otie"
        updateRobotStatus={mockUpdateRobotStatus}
      />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettings Advanced tab', () => {
  beforeEach(() => {
    mockGetShellUpdateState.mockReturnValue({
      downloading: true,
    } as ShellUpdateState)
    mockAboutRobotName.mockReturnValue(<div>Mock AboutRobotName Section</div>)
    mockGantryHoming.mockReturnValue(<div>Mock GantryHoming Section</div>)
    mockDeviceReset.mockReturnValue(<div>Mock DeviceReset Section</div>)
    mockLegacySettings.mockReturnValue(<div>Mock LegacySettings Section</div>)
    mockOpenJupyterControl.mockReturnValue(
      <div>Mock OpenJupyterControl Section</div>
    )
    mockRobotInformation.mockReturnValue(
      <div>Mock RobotInformation Section</div>
    )
    mockRobotServerVersion.mockReturnValue(
      <div>Mock RobotServerVersion Section</div>
    )
    mockShortTrashBin.mockReturnValue(<div>Mock ShortTrashBin Section</div>)
    mockTroubleshooting.mockReturnValue(<div>Mock Troubleshooting Section</div>)
    mockUpdateRobotSoftware.mockReturnValue(
      <div>Mock UpdateRobotSoftware Section</div>
    )
    mockUsageSettings.mockReturnValue(<div>Mock UsageSettings Section</div>)
    mockUseOlderAspirateBehavior.mockReturnValue(
      <div>Mock UseOlderAspirateBehavior Section</div>
    )
    mockUseOlderProtocol.mockReturnValue(
      <div>Mock UseOlderProtocol Section</div>
    )
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(false)
    mockEnableStatusLight.mockReturnValue(<div>mock EnableStatusLight</div>)
    when(mockUseIsRobotBusy).mockReturnValue(false)
  })

  afterAll(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render AboutRobotName section', () => {
    const [{ getByText }] = render()
    getByText('Mock AboutRobotName Section')
  })

  it('should render GantryHoming section', () => {
    const [{ getByText }] = render()
    getByText('Mock GantryHoming Section')
  })

  it('should render DeviceReset section', () => {
    const [{ getByText }] = render()
    getByText('Mock DeviceReset Section')
  })

  it('should render LegacySettings section for OT-2', () => {
    const [{ getByText }] = render()
    getByText('Mock LegacySettings Section')
  })

  it('should not render LegacySettings section for Flex', () => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(true)
    const [{ queryByText }] = render()
    expect(queryByText('Mock LegacySettings Section')).toBeNull()
  })

  it('should render OpenJupyterControl section', () => {
    const [{ getByText }] = render()
    getByText('Mock OpenJupyterControl Section')
  })

  it('should render RobotInformation section', () => {
    const [{ getByText }] = render()
    getByText('Mock RobotInformation Section')
  })

  it('should render RobotServerVersion section', () => {
    const [{ getByText }] = render()
    getByText('Mock RobotServerVersion Section')
  })

  it('should render ShortTrashBin section for OT-2', () => {
    const [{ getByText }] = render()
    getByText('Mock ShortTrashBin Section')
  })

  it('should not render ShortTrashBin section for Flex', () => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(true)
    const [{ queryByText }] = render()
    expect(queryByText('Mock ShortTrashBin Section')).toBeNull()
  })

  it('should render Troubleshooting section', () => {
    const [{ getByText }] = render()
    getByText('Mock Troubleshooting Section')
  })

  it('should render UpdateRobotSoftware section', () => {
    const [{ getByText }] = render()
    getByText('Mock UpdateRobotSoftware Section')
  })

  it('should render UsageSettings section', () => {
    const [{ getByText }] = render()
    getByText('Mock UsageSettings Section')
  })

  it('should not render UsageSettings for Flex', () => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(true)
    const [{ queryByText }] = render()
    expect(queryByText('Mock UsageSettings Section')).toBeNull()
  })

  it('should render UseOlderAspirateBehavior section for OT-2', () => {
    const [{ getByText }] = render()
    getByText('Mock UseOlderAspirateBehavior Section')
  })

  it('should not render UseOlderAspirateBehavior section for Flex', () => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(true)
    const [{ queryByText }] = render()
    expect(queryByText('Mock UseOlderAspirateBehavior Section')).toBeNull()
  })

  it('should render UseOlderProtocol section for OT-2', () => {
    const [{ getByText }] = render()
    getByText('Mock UseOlderProtocol Section')
  })

  it('should not render UseOlderProtocol section for Flex', () => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(true)
    const [{ queryByText }] = render()
    expect(queryByText('Mock UseOlderProtocol Section')).toBeNull()
  })

  it('should not render EnableStatusLight section for OT-2', () => {
    const [{ queryByText }] = render()
    expect(queryByText('mock EnableStatusLight')).not.toBeInTheDocument()
  })

  it('should render EnableStatusLight section for Flex', () => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(true)
    const [{ getByText }] = render()
    getByText('mock EnableStatusLight')
  })
})
