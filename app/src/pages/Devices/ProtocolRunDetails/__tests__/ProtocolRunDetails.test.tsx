import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

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
import { useCurrentRunId } from '../../../../organisms/ProtocolUpload/hooks'
import { ProtocolRunDetails } from '..'
import { ModuleModel, ModuleType } from '@opentrons/shared-data'

import { mockRobotSideAnalysis } from '../../../../organisms/CommandText/__fixtures__'

jest.mock(
  '../../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../../../../organisms/Devices/ProtocolRun/ProtocolRunHeader')
jest.mock('../../../../organisms/Devices/ProtocolRun/ProtocolRunSetup')
jest.mock('../../../../organisms/RunPreview')
jest.mock('../../../../organisms/Devices/ProtocolRun/ProtocolRunModuleControls')
jest.mock('../../../../organisms/ProtocolUpload/hooks')

const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockUseSyncRobotClock = useSyncRobotClock as jest.MockedFunction<
  typeof useSyncRobotClock
>
const mockProtocolRunHeader = ProtocolRunHeader as jest.MockedFunction<
  typeof ProtocolRunHeader
>
const mockRunPreview = RunPreviewComponent as jest.MockedFunction<
  typeof RunPreviewComponent
>
const mockProtocolRunSetup = ProtocolRunSetup as jest.MockedFunction<
  typeof ProtocolRunSetup
>
const mockProtocolRunModuleControls = ProtocolRunModuleControls as jest.MockedFunction<
  typeof ProtocolRunModuleControls
>
const mockUseModuleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById as jest.MockedFunction<
  typeof useModuleRenderInfoForProtocolById
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>

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
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: false,
      isRunIdle: true,
    })
    mockProtocolRunHeader.mockReturnValue(<div>Mock ProtocolRunHeader</div>)
    mockRunPreview.mockReturnValue(<div>Mock RunPreview</div>)
    mockProtocolRunSetup.mockReturnValue(<div>Mock ProtocolRunSetup</div>)
    mockProtocolRunModuleControls.mockReturnValue(
      <div>Mock ProtocolRunModuleControls</div>
    )
    mockUseModuleRenderInfoForProtocolById.mockReturnValue({
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
    mockUseCurrentRunId.mockReturnValue(RUN_ID)
    mockUseMostRecentCompletedAnalysis.mockReturnValue(mockRobotSideAnalysis)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('does not render a ProtocolRunHeader when a robot is not found', () => {
    mockUseRobot.mockReturnValue(null)
    render(
      `/devices/otie/protocol-runs/${RUN_ID}/setup`
    )

    expect(screen.queryByText('Mock ProtocolRunHeader')).toBeFalsy()
  })

  it('renders a ProtocolRunHeader when a robot is found', () => {
    render(
      `/devices/otie/protocol-runs/${RUN_ID}/setup`
    )

    screen.getByText('Mock ProtocolRunHeader')
  })

  it('syncs robot system clock on mount', () => {
    render(`/devices/otie/protocol-runs/${RUN_ID}/setup`)

    expect(mockUseSyncRobotClock).toHaveBeenCalledWith('otie')
  })

  it('renders navigation tabs', () => {
    render(
      `/devices/otie/protocol-runs/${RUN_ID}/setup`
    )

    screen.getByText('Setup')
    screen.getByText('Module Controls')
    screen.getByText('Run Preview')
  })

  it('defaults to setup content when given an unspecified tab', () => {
    render(
      `/devices/otie/protocol-runs/${RUN_ID}/this-is-not-a-real-tab`
    )

    screen.getByText('Mock ProtocolRunSetup')
  })

  it('renders a run  when the run  tab is clicked', () => {
    render(
      `/devices/otie/protocol-runs/${RUN_ID}`
    )

    expect(screen.queryByText('Mock RunPreview')).toBeFalsy()
    const runTab = screen.getByText('Run Preview')
    fireEvent.click(runTab)
    screen.getByText('Mock RunPreview')
  })

  it('renders protocol run setup when the setup tab is clicked', () => {
    render(
      `/devices/otie/protocol-runs/${RUN_ID}`
    )

    const setupTab = screen.getByText('Setup')
    const runTab = screen.getByText('Run Preview')
    fireEvent.click(runTab)
    screen.getByText('Mock RunPreview')
    expect(screen.queryByText('Mock ProtocolRunSetup')).toBeFalsy()
    fireEvent.click(setupTab)
    screen.getByText('Mock ProtocolRunSetup')
  })

  it('renders module controls when the module controls tab is clicked', () => {
    render(
      `/devices/otie/protocol-runs/${RUN_ID}`
    )

    const moduleTab = screen.getByText('Module Controls')
    screen.getByText('Mock ProtocolRunSetup')
    expect(screen.queryByText('Mock ProtocolRunModuleControls')).toBeFalsy()
    fireEvent.click(moduleTab)
    screen.getByText('Mock ProtocolRunModuleControls')
    expect(screen.queryByText('Mock ProtocolRunSetup')).toBeFalsy()
  })

  it('should NOT render module controls when there are no modules', () => {
    mockUseModuleRenderInfoForProtocolById.mockReturnValue({})
    render(
      `/devices/otie/protocol-runs/${RUN_ID}/setup`
    )
    expect(screen.queryByText('Module Controls')).toBeNull()
  })

  it('disables module controls tab when the run current but not idle', () => {
    mockUseCurrentRunId.mockReturnValue(RUN_ID)
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
    render(
      `/devices/otie/protocol-runs/${RUN_ID}`
    )

    const moduleTab = screen.getByText('Module Controls')
    expect(screen.queryByText('Mock ProtocolRunModuleControls')).toBeFalsy()
    fireEvent.click(moduleTab)
    expect(screen.queryByText('Mock ProtocolRunModuleControls')).toBeFalsy()
  })

  it('disables run  tab if robot-analyzed protocol data is null', () => {
    mockUseMostRecentCompletedAnalysis.mockReturnValue(null)
    render(
      `/devices/otie/protocol-runs/${RUN_ID}`
    )

    const runTab = screen.getByText('Run Preview')
    screen.getByText('Mock ProtocolRunSetup')
    expect(screen.queryByText('Mock RunPreview')).toBeFalsy()
    fireEvent.click(runTab)
    expect(screen.queryByText('Mock RunPreview')).toBeFalsy()
  })

  it('redirects to the run  tab when the run is not current', () => {
    mockUseCurrentRunId.mockReturnValue(null)
    render(
      `/devices/otie/protocol-runs/${RUN_ID}/setup`
    )

    screen.getByText('Mock RunPreview')
    expect(screen.queryByText('Mock ProtocolRunSetup')).toBeFalsy()
  })
})
