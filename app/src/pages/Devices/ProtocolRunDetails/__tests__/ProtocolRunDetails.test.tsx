import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import noModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/simpleV4.json'

import { i18n } from '../../../../i18n'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'
import {
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
  useRobot,
  useRunStatuses,
  useSyncRobotClock,
} from '../../../../organisms/Devices/hooks'
import { ProtocolRunHeader } from '../../../../organisms/Devices/ProtocolRun/ProtocolRunHeader'
import { ProtocolRunModuleControls } from '../../../../organisms/Devices/ProtocolRun/ProtocolRunModuleControls'
import { ProtocolRunSetup } from '../../../../organisms/Devices/ProtocolRun/ProtocolRunSetup'
import { RunLog } from '../../../../organisms/Devices/ProtocolRun/RunLog'
import { useCurrentRunId } from '../../../../organisms/ProtocolUpload/hooks'
import { ProtocolRunDetails } from '..'
import { ModuleModel, ModuleType } from '@opentrons/shared-data'

import type { LegacySchemaAdapterOutput } from '@opentrons/shared-data'

jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../../../../organisms/Devices/ProtocolRun/ProtocolRunHeader')
jest.mock('../../../../organisms/Devices/ProtocolRun/ProtocolRunSetup')
jest.mock('../../../../organisms/Devices/ProtocolRun/RunLog')
jest.mock('../../../../organisms/Devices/ProtocolRun/ProtocolRunModuleControls')
jest.mock('../../../../organisms/ProtocolUpload/hooks')

const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockUseSyncRobotClock = useSyncRobotClock as jest.MockedFunction<
  typeof useSyncRobotClock
>
const mockProtocolRunHeader = ProtocolRunHeader as jest.MockedFunction<
  typeof ProtocolRunHeader
>
const mockRunLog = RunLog as jest.MockedFunction<typeof RunLog>
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
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
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
    mockRunLog.mockReturnValue(<div>Mock RunLog</div>)
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
    mockUseProtocolDetailsForRun.mockReturnValue({
      protocolData: (noModulesProtocol as unknown) as LegacySchemaAdapterOutput,
      displayName: 'mock display name',
      protocolKey: 'fakeProtocolKey',
      robotType: 'OT-2 Standard',
    })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('does not render a ProtocolRunHeader when a robot is not found', () => {
    mockUseRobot.mockReturnValue(null)
    const [{ queryByText }] = render(
      `/devices/otie/protocol-runs/${RUN_ID}/setup`
    )

    expect(queryByText('Mock ProtocolRunHeader')).toBeFalsy()
  })

  it('renders a ProtocolRunHeader when a robot is found', () => {
    const [{ getByText }] = render(
      `/devices/otie/protocol-runs/${RUN_ID}/setup`
    )

    getByText('Mock ProtocolRunHeader')
  })

  it('syncs robot system clock on mount', () => {
    render(`/devices/otie/protocol-runs/${RUN_ID}/setup`)

    expect(mockUseSyncRobotClock).toHaveBeenCalledWith('otie')
  })

  it('renders navigation tabs', () => {
    const [{ getByText }] = render(
      `/devices/otie/protocol-runs/${RUN_ID}/setup`
    )

    getByText('Setup')
    getByText('Module Controls')
    getByText('Run Log')
  })

  it('defaults to setup content when given an unspecified tab', () => {
    const [{ getByText }] = render(
      `/devices/otie/protocol-runs/${RUN_ID}/this-is-not-a-real-tab`
    )

    getByText('Mock ProtocolRunSetup')
  })

  it('renders a run log when the run log tab is clicked', () => {
    const [{ getByText, queryByText }] = render(
      `/devices/otie/protocol-runs/${RUN_ID}`
    )

    expect(queryByText('Mock RunLog')).toBeFalsy()
    const runTab = getByText('Run Log')
    runTab.click()
    getByText('Mock RunLog')
  })

  it('renders protocol run setup when the setup tab is clicked', () => {
    const [{ getByText, queryByText }] = render(
      `/devices/otie/protocol-runs/${RUN_ID}`
    )

    const setupTab = getByText('Setup')
    const runTab = getByText('Run Log')
    runTab.click()
    getByText('Mock RunLog')
    expect(queryByText('Mock ProtocolRunSetup')).toBeFalsy()
    setupTab.click()
    getByText('Mock ProtocolRunSetup')
  })

  it('renders module controls when the module controls tab is clicked', () => {
    const [{ getByText, queryByText }] = render(
      `/devices/otie/protocol-runs/${RUN_ID}`
    )

    const moduleTab = getByText('Module Controls')
    getByText('Mock ProtocolRunSetup')
    expect(queryByText('Mock ProtocolRunModuleControls')).toBeFalsy()
    moduleTab.click()
    getByText('Mock ProtocolRunModuleControls')
    expect(queryByText('Mock ProtocolRunSetup')).toBeFalsy()
  })

  it('should NOT render module controls when there are no modules', () => {
    mockUseModuleRenderInfoForProtocolById.mockReturnValue({})
    const [{ queryByText }] = render(
      `/devices/otie/protocol-runs/${RUN_ID}/setup`
    )
    expect(queryByText('Module Controls')).toBeNull()
  })

  it('disables module controls tab when the run current but not idle', () => {
    mockUseCurrentRunId.mockReturnValue(RUN_ID)
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
    const [{ getByText, queryByText }] = render(
      `/devices/otie/protocol-runs/${RUN_ID}`
    )

    const moduleTab = getByText('Module Controls')
    expect(queryByText('Mock ProtocolRunModuleControls')).toBeFalsy()
    moduleTab.click()
    expect(queryByText('Mock ProtocolRunModuleControls')).toBeFalsy()
  })

  it('disables run log tab if robot-analyzed protocol data is null', () => {
    mockUseProtocolDetailsForRun.mockReturnValue({
      protocolData: null,
      displayName: null,
      protocolKey: null,
      robotType: 'OT-2 Standard',
    })
    const [{ getByText, queryByText }] = render(
      `/devices/otie/protocol-runs/${RUN_ID}`
    )

    const runTab = getByText('Run Log')
    getByText('Mock ProtocolRunSetup')
    expect(queryByText('Mock RunLog')).toBeFalsy()
    runTab.click()
    expect(queryByText('Mock RunLog')).toBeFalsy()
  })

  it('redirects to the run log tab when the run is not current', () => {
    mockUseCurrentRunId.mockReturnValue(null)
    const [{ getByText, queryByText }] = render(
      `/devices/otie/protocol-runs/${RUN_ID}/setup`
    )

    getByText('Mock RunLog')
    expect(queryByText('Mock ProtocolRunSetup')).toBeFalsy()
  })
})
