import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useIsFlex, useIsRobotBusy } from '/app/redux-resources/robots'
import { getFeatureFlags } from '/app/redux/config'
import { getShellUpdateState } from '/app/redux/shell'
import { useCurrentRun } from '/app/resources/runs'

import {
  DeviceReset,
  DisableStackerSensors,
  DisplayRobotName,
  EnableStatusLight,
  EnterRobotEncryptionKey,
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
} from '../AdvancedTab'
import { RobotSettingsAdvanced } from '../RobotSettingsAdvanced'

import type * as Config from '/app/redux/config'
import type { ShellUpdateState } from '/app/redux/shell/types'
import type * as ShellUpdate from '/app/redux/shell/update'

vi.mock('/app/redux-resources/robots')
vi.mock('/app/redux/discovery/selectors')
vi.mock('/app/redux/config', async importOriginal => {
  const actual = await importOriginal<typeof Config>()
  return {
    ...actual,
    getFeatureFlags: vi.fn(),
  }
})
vi.mock('/app/redux/shell/update', async importOriginal => {
  const actual = await importOriginal<typeof ShellUpdate>()
  return {
    ...actual,
    getShellUpdateState: vi.fn(),
  }
})
vi.mock('../AdvancedTab/DeviceReset')
vi.mock('../AdvancedTab/DisplayRobotName')
vi.mock('../AdvancedTab/EnableStatusLight')
vi.mock('../AdvancedTab/EnterRobotEncryptionKey')
vi.mock('../AdvancedTab/GantryHoming')
vi.mock('../AdvancedTab/LegacySettings')
vi.mock('../AdvancedTab/OpenJupyterControl')
vi.mock('../AdvancedTab/RobotInformation')
vi.mock('../AdvancedTab/RobotServerVersion')
vi.mock('../AdvancedTab/ShortTrashBin')
vi.mock('../AdvancedTab/Troubleshooting')
vi.mock('../AdvancedTab/UpdateRobotSoftware')
vi.mock('../AdvancedTab/UsageSettings')
vi.mock('../AdvancedTab/UseOlderAspirateBehavior')
vi.mock('../AdvancedTab/DisableStackerSensors')
vi.mock('/app/resources/runs')

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotSettingsAdvanced robotName="otie" isRobotBusy={false} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettings Advanced tab', () => {
  beforeEach(() => {
    vi.mocked(getShellUpdateState).mockReturnValue({
      downloading: true,
    } as ShellUpdateState)
    vi.mocked(DisplayRobotName).mockReturnValue(
      <div>Mock AboutRobotName Section</div>
    )
    vi.mocked(GantryHoming).mockReturnValue(
      <div>Mock GantryHoming Section</div>
    )
    vi.mocked(DeviceReset).mockReturnValue(<div>Mock DeviceReset Section</div>)
    vi.mocked(LegacySettings).mockReturnValue(
      <div>Mock LegacySettings Section</div>
    )
    vi.mocked(OpenJupyterControl).mockReturnValue(
      <div>Mock OpenJupyterControl Section</div>
    )
    vi.mocked(RobotInformation).mockReturnValue(
      <div>Mock RobotInformation Section</div>
    )
    vi.mocked(RobotServerVersion).mockReturnValue(
      <div>Mock RobotServerVersion Section</div>
    )
    vi.mocked(ShortTrashBin).mockReturnValue(
      <div>Mock ShortTrashBin Section</div>
    )
    vi.mocked(Troubleshooting).mockReturnValue(
      <div>Mock Troubleshooting Section</div>
    )
    vi.mocked(UpdateRobotSoftware).mockReturnValue(
      <div>Mock UpdateRobotSoftware Section</div>
    )
    vi.mocked(UsageSettings).mockReturnValue(
      <div>Mock UsageSettings Section</div>
    )
    vi.mocked(UseOlderAspirateBehavior).mockReturnValue(
      <div>Mock UseOlderAspirateBehavior Section</div>
    )
    when(useIsFlex).calledWith('otie').thenReturn(false)
    vi.mocked(EnableStatusLight).mockReturnValue(
      <div>mock EnableStatusLight</div>
    )
    vi.mocked(GantryHoming).mockReturnValue(
      <div>Mock GantryHoming Section</div>
    )
    vi.mocked(DisableStackerSensors).mockReturnValue(
      <div>Mock DisableStackerSensors Section</div>
    )
    vi.mocked(EnterRobotEncryptionKey).mockReturnValue(
      <div>Mock EnterRobotEncryptionKey Section</div>
    )
    vi.mocked(getFeatureFlags).mockReturnValue({})
    vi.mocked(useIsRobotBusy).mockReturnValue(false)
    vi.mocked(useCurrentRun).mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render AboutRobotName section', () => {
    render()
    screen.getByText('Mock AboutRobotName Section')
  })

  it('should not render EnterRobotEncryptionKey when accessControlMode is off', () => {
    render()
    expect(
      screen.queryByText('Mock EnterRobotEncryptionKey Section')
    ).toBeNull()
  })

  it('should render EnterRobotEncryptionKey when accessControlMode is on', () => {
    vi.mocked(getFeatureFlags).mockReturnValue({ accessControlMode: true })
    render()
    screen.getByText('Mock EnterRobotEncryptionKey Section')
  })

  it('should render GantryHoming section', () => {
    render()
    screen.getByText('Mock GantryHoming Section')
  })

  it('should render DeviceReset section', () => {
    render()
    screen.getByText('Mock DeviceReset Section')
  })

  it('should render LegacySettings section for OT-2', () => {
    render()
    screen.getByText('Mock LegacySettings Section')
  })

  it('should not render LegacySettings section for Flex', () => {
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    expect(screen.queryByText('Mock LegacySettings Section')).toBeNull()
  })

  it('should render OpenJupyterControl section', () => {
    render()
    screen.getByText('Mock OpenJupyterControl Section')
  })

  it('should render RobotInformation section', () => {
    render()
    screen.getByText('Mock RobotInformation Section')
  })

  it('should render RobotServerVersion section', () => {
    render()
    screen.getByText('Mock RobotServerVersion Section')
  })

  it('should render ShortTrashBin section for OT-2', () => {
    render()
    screen.getByText('Mock ShortTrashBin Section')
  })

  it('should not render ShortTrashBin section for Flex', () => {
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    expect(screen.queryByText('Mock ShortTrashBin Section')).toBeNull()
  })

  it('should render Troubleshooting section', () => {
    render()
    screen.getByText('Mock Troubleshooting Section')
  })

  it('should render UpdateRobotSoftware section', () => {
    render()
    screen.getByText('Mock UpdateRobotSoftware Section')
  })

  it('should render UsageSettings section', () => {
    render()
    screen.getByText('Mock UsageSettings Section')
  })

  it('should not render UsageSettings for Flex', () => {
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    expect(screen.queryByText('Mock UsageSettings Section')).toBeNull()
  })

  it('should render UseOlderAspirateBehavior section for OT-2', () => {
    render()
    screen.getByText('Mock UseOlderAspirateBehavior Section')
  })

  it('should not render UseOlderAspirateBehavior section for Flex', () => {
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    expect(
      screen.queryByText('Mock UseOlderAspirateBehavior Section')
    ).toBeNull()
  })

  it('should not render EnableStatusLight section for OT-2', () => {
    render()
    expect(screen.queryByText('mock EnableStatusLight')).not.toBeInTheDocument()
  })

  it('should render EnableStatusLight section for Flex', () => {
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    screen.getByText('mock EnableStatusLight')
  })

  it('should not render DisableStackerSensors section for OT-2', () => {
    render()
    expect(
      screen.queryByText('Mock DisableStackerSensors')
    ).not.toBeInTheDocument()
  })

  it('should render DisableStackerSensors section for Flex', () => {
    when(useIsFlex).calledWith('otie').thenReturn(true)
    render()
    screen.getByText('Mock DisableStackerSensors Section')
  })
})
