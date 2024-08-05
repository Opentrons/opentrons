import * as React from 'react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { Route, MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'
import {
  useModuleRenderInfoForProtocolById,
  useRobot,
  useRunStatuses,
  useSyncRobotClock,
} from '../../../../organisms/Devices/hooks'
import { useMostRecentCompletedAnalysis } from '../../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ProtocolRunHeader } from '../../../../organisms/Devices/ProtocolRun/ProtocolRunHeader'
import { ProtocolRunModuleControls } from '../../../../organisms/Devices/ProtocolRun/ProtocolRunModuleControls'
import { ProtocolRunSetup } from '../../../../organisms/Devices/ProtocolRun/ProtocolRunSetup'
import { RunPreviewComponent } from '../../../../organisms/RunPreview'
import { ProtocolRunRuntimeParameters } from '../../../../organisms/Devices/ProtocolRun/ProtocolRunRunTimeParameters'
import { useCurrentRunId } from '../../../../organisms/ProtocolUpload/hooks'
import { mockRobotSideAnalysis } from '../../../../molecules/Command/__fixtures__'
import { useFeatureFlag } from '../../../../redux/config'
import { ProtocolRunDetails } from '..'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'

vi.mock(
  '../../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
vi.mock('../../../../organisms/Devices/hooks')
vi.mock('../../../../organisms/Devices/ProtocolRun/ProtocolRunHeader')
vi.mock('../../../../organisms/Devices/ProtocolRun/ProtocolRunSetup')
vi.mock('../../../../organisms/RunPreview')
vi.mock('../../../../organisms/Devices/ProtocolRun/ProtocolRunModuleControls')
vi.mock('../../../../organisms/ProtocolUpload/hooks')
vi.mock(
  '../../../../organisms/Devices/ProtocolRun/ProtocolRunRunTimeParameters'
)
vi.mock('../../../../redux/config')

const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]

const mockMagneticModule = {
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/devices/:robotName/protocol-runs/:runId/:protocolRunDetailsTab?">
        <ProtocolRunDetails />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const RUN_ID = '95e67900-bc9f-4fbf-92c6-cc4d7226a51b'

describe('ProtocolRunDetails', () => {
  beforeEach(() => {
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    vi.mocked(useRobot).mockReturnValue(mockConnectableRobot)
    vi.mocked(useRunStatuses).mockReturnValue({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: false,
      isRunIdle: true,
    })
    vi.mocked(ProtocolRunHeader).mockReturnValue(
      <div>Mock ProtocolRunHeader</div>
    )
    vi.mocked(RunPreviewComponent).mockReturnValue(<div>Mock RunPreview</div>)
    vi.mocked(ProtocolRunSetup).mockReturnValue(
      <div>Mock ProtocolRunSetup</div>
    )
    vi.mocked(ProtocolRunModuleControls).mockReturnValue(
      <div>Mock ProtocolRunModuleControls</div>
    )
    vi.mocked(ProtocolRunRuntimeParameters).mockReturnValue(
      <div>Mock ProtocolRunRuntimeParameters</div>
    )
    vi.mocked(useModuleRenderInfoForProtocolById).mockReturnValue({
      [mockMagneticModule.moduleId]: {
        moduleId: mockMagneticModule.moduleId,
        x: MOCK_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_MAGNETIC_MODULE_COORDS[2],
        moduleDef: mockMagneticModule as any,
        nestedLabwareDef: null,
        nestedLabwareId: null,
        protocolLoadOrder: 0,
        attachedModuleMatch: null,
      },
    } as any)
    vi.mocked(useCurrentRunId).mockReturnValue(RUN_ID)
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(
      mockRobotSideAnalysis
    )
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('does not render a ProtocolRunHeader when a robot is not found', () => {
    vi.mocked(useRobot).mockReturnValue(null)
    render(`/devices/otie/protocol-runs/${RUN_ID}/setup`)

    expect(screen.queryByText('Mock ProtocolRunHeader')).toBeFalsy()
  })

  it('renders a ProtocolRunHeader when a robot is found', () => {
    render(`/devices/otie/protocol-runs/${RUN_ID}/setup`)

    screen.getByText('Mock ProtocolRunHeader')
  })

  it('syncs robot system clock on mount', () => {
    render(`/devices/otie/protocol-runs/${RUN_ID}/setup`)

    expect(vi.mocked(useSyncRobotClock)).toHaveBeenCalledWith('otie')
  })

  it('renders navigation tabs', () => {
    render(`/devices/otie/protocol-runs/${RUN_ID}/setup`)

    screen.getByText('Setup')
    screen.getByText('Module Controls')
    screen.getByText('Run Preview')
  })

  it('defaults to setup content when given an unspecified tab', () => {
    render(`/devices/otie/protocol-runs/${RUN_ID}/this-is-not-a-real-tab`)

    screen.getByText('Mock ProtocolRunSetup')
  })

  it('renders a run  when the run  tab is clicked', () => {
    render(`/devices/otie/protocol-runs/${RUN_ID}`)

    expect(screen.queryByText('Mock RunPreview')).toBeFalsy()
    const runTab = screen.getByText('Run Preview')
    fireEvent.click(runTab)
    screen.getByText('Mock RunPreview')
  })

  it('renders protocol run setup when the setup tab is clicked', () => {
    render(`/devices/otie/protocol-runs/${RUN_ID}`)

    const setupTab = screen.getByText('Setup')
    const runTab = screen.getByText('Run Preview')
    fireEvent.click(runTab)
    screen.getByText('Mock RunPreview')
    expect(screen.queryByText('Mock ProtocolRunSetup')).toBeFalsy()
    fireEvent.click(setupTab)
    screen.getByText('Mock ProtocolRunSetup')
  })

  it('renders module controls when the module controls tab is clicked', () => {
    render(`/devices/otie/protocol-runs/${RUN_ID}`)

    const moduleTab = screen.getByText('Module Controls')
    screen.getByText('Mock ProtocolRunSetup')
    expect(screen.queryByText('Mock ProtocolRunModuleControls')).toBeFalsy()
    fireEvent.click(moduleTab)
    screen.getByText('Mock ProtocolRunModuleControls')
    expect(screen.queryByText('Mock ProtocolRunSetup')).toBeFalsy()
  })

  it('should NOT render module controls when there are no modules', () => {
    vi.mocked(useModuleRenderInfoForProtocolById).mockReturnValue({})
    render(`/devices/otie/protocol-runs/${RUN_ID}/setup`)
    expect(screen.queryByText('Module Controls')).toBeNull()
  })

  it('disables module controls tab when the run current but not idle', () => {
    vi.mocked(useCurrentRunId).mockReturnValue(RUN_ID)
    vi.mocked(useRunStatuses).mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
    render(`/devices/otie/protocol-runs/${RUN_ID}`)

    const moduleTab = screen.getByText('Module Controls')
    expect(screen.queryByText('Mock ProtocolRunModuleControls')).toBeFalsy()
    fireEvent.click(moduleTab)
    expect(screen.queryByText('Mock ProtocolRunModuleControls')).toBeFalsy()
  })

  it('disables run  tab if robot-analyzed protocol data is null', () => {
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(null)
    render(`/devices/otie/protocol-runs/${RUN_ID}`)

    const runTab = screen.getByText('Run Preview')
    screen.getByText('Mock ProtocolRunSetup')
    expect(screen.queryByText('Mock RunPreview')).toBeFalsy()
    fireEvent.click(runTab)
    expect(screen.queryByText('Mock RunPreview')).toBeFalsy()
  })

  it('redirects to the run  tab when the run is not current', () => {
    vi.mocked(useCurrentRunId).mockReturnValue(null)
    render(`/devices/otie/protocol-runs/${RUN_ID}/setup`)

    screen.getByText('Mock RunPreview')
    expect(screen.queryByText('Mock ProtocolRunSetup')).toBeFalsy()
  })

  it('renders Parameters tab when runtime parameters ff is on', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    render(`/devices/otie/protocol-runs/${RUN_ID}/setup`)

    screen.getByText('Setup')
    screen.getByText('Parameters')
    screen.getByText('Module Controls')
    screen.getByText('Run Preview')
  })

  it('renders protocol run parameters when the parameters tab is clicked', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    render(`/devices/otie/protocol-runs/${RUN_ID}`)

    const parametersTab = screen.getByText('Parameters')
    const runTab = screen.getByText('Run Preview')
    fireEvent.click(runTab)
    screen.getByText('Mock RunPreview')
    expect(screen.queryByText('Mock ProtocolRunRuntimeParameters')).toBeFalsy()
    fireEvent.click(parametersTab)
    screen.getByText('Mock ProtocolRunRuntimeParameters')
  })
})
