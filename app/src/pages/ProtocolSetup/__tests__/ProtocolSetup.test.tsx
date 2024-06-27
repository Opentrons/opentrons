import * as React from 'react'
import { Route, MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { when } from 'vitest-when'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'

import { RUN_STATUS_IDLE, RUN_STATUS_STOPPED } from '@opentrons/api-client'
import {
  useAllPipetteOffsetCalibrationsQuery,
  useInstrumentsQuery,
  useProtocolQuery,
  useDoorQuery,
  useModulesQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'
import { renderWithProviders } from '../../../__testing-utils__'
import { mockHeaterShaker } from '../../../redux/modules/__fixtures__'
import {
  getDeckDefFromRobotType,
  FLEX_ROBOT_TYPE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  flexDeckDefV5,
} from '@opentrons/shared-data'

import { i18n } from '../../../i18n'
import { useToaster } from '../../../organisms/ToasterOven'
import { mockRobotSideAnalysis } from '../../../molecules/Command/__fixtures__'
import {
  useAttachedModules,
  useLPCDisabledReason,
  useModuleCalibrationStatus,
  useProtocolAnalysisErrors,
  useRobotType,
  useRunCreatedAtTimestamp,
  useTrackProtocolRunEvent,
} from '../../../organisms/Devices/hooks'
import { getLocalRobot } from '../../../redux/discovery'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '../../../redux/analytics'
import { ProtocolSetupLiquids } from '../../../organisms/ProtocolSetupLiquids'
import { getProtocolModulesInfo } from '../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { ProtocolSetupModulesAndDeck } from '../../../organisms/ProtocolSetupModulesAndDeck'
import { getUnmatchedModulesForProtocol } from '../../../organisms/ProtocolSetupModulesAndDeck/utils'
import { useLaunchLPC } from '../../../organisms/LabwarePositionCheck/useLaunchLPC'
import { ConfirmCancelRunModal } from '../../../organisms/OnDeviceDisplay/RunningProtocol'
import { mockProtocolModuleInfo } from '../../../organisms/ProtocolSetupInstruments/__fixtures__'
import {
  useProtocolHasRunTimeParameters,
  useRunControls,
  useRunStatus,
} from '../../../organisms/RunTimeControl/hooks'
import { useIsHeaterShakerInProtocol } from '../../../organisms/ModuleCard/hooks'
import { useDeckConfigurationCompatibility } from '../../../resources/deck_configuration/hooks'
import { ConfirmAttachedModal } from '../../../pages/ProtocolSetup/ConfirmAttachedModal'
import { ProtocolSetup } from '../../../pages/ProtocolSetup'
import { useNotifyRunQuery } from '../../../resources/runs'
import { useFeatureFlag } from '../../../redux/config'
import { ViewOnlyParameters } from '../../../organisms/ProtocolSetupParameters/ViewOnlyParameters'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { mockRunTimeParameterData } from '../../ProtocolDetails/fixtures'
import { useNotifyDeckConfigurationQuery } from '../../../resources/deck_configuration'

import type { UseQueryResult } from 'react-query'
import type * as SharedData from '@opentrons/shared-data'
import type * as ReactRouterDom from 'react-router-dom'
// Mock IntersectionObserver
class IntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
})

let mockHistoryPush = vi.fn()

vi.mock('@opentrons/shared-data', async importOriginal => {
  const sharedData = await importOriginal<typeof SharedData>()
  return {
    ...sharedData,
    getDeckDefFromRobotType: vi.fn(),
  }
})

vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<typeof ReactRouterDom>()
  return {
    ...reactRouterDom,
    useHistory: () => ({
      push: mockHistoryPush,
    }),
  }
})

vi.mock('@opentrons/react-api-client')
vi.mock('../../../organisms/LabwarePositionCheck/useLaunchLPC')
vi.mock('../../../organisms/Devices/hooks')
vi.mock('../../../redux/config')
vi.mock('../../../organisms/ProtocolSetupParameters/ViewOnlyParameters')
vi.mock(
  '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
vi.mock('../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo')
vi.mock('../../../organisms/ProtocolSetupModulesAndDeck')
vi.mock('../../../organisms/ProtocolSetupModulesAndDeck/utils')
vi.mock('../../../organisms/OnDeviceDisplay/RunningProtocol')
vi.mock('../../../organisms/RunTimeControl/hooks')
vi.mock('../../../organisms/ProtocolSetupLiquids')
vi.mock('../../../organisms/ModuleCard/hooks')
vi.mock('../../../redux/discovery/selectors')
vi.mock('../ConfirmAttachedModal')
vi.mock('../../../organisms/ToasterOven')
vi.mock('../../../resources/deck_configuration/hooks')
vi.mock('../../../resources/runs')
vi.mock('../../../resources/deck_configuration')

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/runs/:runId/setup/">
        <ProtocolSetup />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const ROBOT_NAME = 'fake-robot-name'
const RUN_ID = 'my-run-id'
const ROBOT_SERIAL_NUMBER = 'OT123'
const PROTOCOL_ID = 'my-protocol-id'
const PROTOCOL_NAME = 'Mock Protocol Name'
const CREATED_AT = 'top of the hour'
const mockGripperData = {
  instrumentModel: 'gripper_v1',
  instrumentType: 'gripper',
  mount: 'extension',
  serialNumber: 'ghi789',
}
const mockRightPipetteData = {
  instrumentModel: 'p300_single_v2',
  instrumentType: 'p300',
  mount: 'right',
  serialNumber: 'abc123',
}
const mockLeftPipetteData = {
  instrumentModel: 'p1000_single_v2',
  instrumentType: 'p1000',
  mount: 'left',
  serialNumber: 'def456',
}
const mockEmptyAnalysis = ({
  modules: [],
  labware: [],
  pipettes: [],
  commands: [],
} as unknown) as SharedData.CompletedProtocolAnalysis
const mockLiquids = [
  {
    id: 'm',
    displayName: 'mock',
    description: 'Mock liquid',
  },
]

const mockPlay = vi.fn()
const mockOffset = {
  id: 'fake_labware_offset',
  createdAt: 'timestamp',
  definitionUri: 'fake_def_uri',
  location: { slotName: 'A1' },
  vector: { x: 1, y: 2, z: 3 },
}

const mockDoorStatus = {
  data: {
    status: 'closed',
    doorRequiredClosedForProtocol: true,
  },
}
const mockFixture = {
  cutoutId: 'cutoutD1',
  cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
}

const MOCK_MAKE_SNACKBAR = vi.fn()
const mockTrackProtocolRunEvent = vi.fn()

describe('ProtocolSetup', () => {
  let mockLaunchLPC = vi.fn()
  beforeEach(() => {
    mockLaunchLPC = vi.fn()
    mockHistoryPush = vi.fn()
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    vi.mocked(useLPCDisabledReason).mockReturnValue(null)
    vi.mocked(useAttachedModules).mockReturnValue([])
    vi.mocked(useModuleCalibrationStatus).mockReturnValue({ complete: true })
    vi.mocked(getLocalRobot).mockReturnValue({
      ...mockConnectableRobot,
      name: ROBOT_NAME,
      health: {
        ...mockConnectableRobot.health,
        robot_serial: ROBOT_SERIAL_NUMBER,
      },
    } as any)
    when(vi.mocked(useRobotType))
      .calledWith(ROBOT_NAME)
      .thenReturn(FLEX_ROBOT_TYPE)
    when(vi.mocked(useRunControls))
      .calledWith(RUN_ID)
      .thenReturn({
        play: mockPlay,
        pause: () => {},
        stop: () => {},
        reset: () => {},
        resumeFromRecovery: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
        isResumeRunFromRecoveryActionLoading: false,
      })
    when(vi.mocked(useRunStatus)).calledWith(RUN_ID).thenReturn(RUN_STATUS_IDLE)
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: mockEmptyAnalysis,
    } as any)
    when(vi.mocked(useRunCreatedAtTimestamp))
      .calledWith(RUN_ID)
      .thenReturn(CREATED_AT)
    when(vi.mocked(getProtocolModulesInfo))
      .calledWith(mockEmptyAnalysis, flexDeckDefV5 as any)
      .thenReturn([])
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith([], [])
      .thenReturn({ missingModuleIds: [], remainingAttachedModules: [] })
    when(vi.mocked(getDeckDefFromRobotType))
      .calledWith('OT-3 Standard')
      .thenReturn(flexDeckDefV5 as any)
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID, { staleTime: Infinity })
      .thenReturn({
        data: {
          data: {
            protocolId: PROTOCOL_ID,
            labwareOffsets: [mockOffset],
          },
        },
      } as any)
    when(vi.mocked(useProtocolAnalysisErrors))
      .calledWith(RUN_ID)
      .thenReturn({ analysisErrors: null })
    when(vi.mocked(useProtocolQuery))
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .thenReturn({
        data: { data: { metadata: { protocolName: PROTOCOL_NAME } } },
      } as any)
    when(vi.mocked(useInstrumentsQuery))
      .calledWith()
      .thenReturn({
        data: {
          data: [mockLeftPipetteData, mockRightPipetteData, mockGripperData],
        },
      } as any)
    when(vi.mocked(useAllPipetteOffsetCalibrationsQuery))
      .calledWith()
      .thenReturn({ data: { data: [] } } as any)
    when(vi.mocked(useLaunchLPC))
      .calledWith(RUN_ID, FLEX_ROBOT_TYPE, PROTOCOL_NAME)
      .thenReturn({
        launchLPC: mockLaunchLPC,
        LPCWizard: <div>mock LPC Wizard</div>,
      })
    vi.mocked(useIsHeaterShakerInProtocol).mockReturnValue(false)
    vi.mocked(useDoorQuery).mockReturnValue({ data: mockDoorStatus } as any)
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [mockHeaterShaker] },
    } as any)
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [mockFixture],
    } as UseQueryResult<SharedData.DeckConfiguration>)
    when(vi.mocked(useToaster))
      .calledWith()
      .thenReturn(({
        makeSnackbar: MOCK_MAKE_SNACKBAR,
      } as unknown) as any)
    vi.mocked(useDeckConfigurationCompatibility).mockReturnValue([])
    vi.mocked(useProtocolHasRunTimeParameters).mockReturnValue(false)
    when(vi.mocked(useTrackProtocolRunEvent))
      .calledWith(RUN_ID, ROBOT_NAME)
      .thenReturn({ trackProtocolRunEvent: mockTrackProtocolRunEvent })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render text, image, and buttons', () => {
    render(`/runs/${RUN_ID}/setup/`)
    screen.getByText('Prepare to run')
    screen.getByText('Instruments')
    screen.getByText('Deck hardware')
    screen.getByText('Labware')
    screen.getByText('Labware Position Check')
    screen.getByText('Liquids')
  })

  it('should play protocol when click play button', () => {
    render(`/runs/${RUN_ID}/setup/`)
    expect(mockPlay).toBeCalledTimes(0)
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    expect(mockPlay).toBeCalledTimes(1)
  })

  it('should launch cancel modal when click close button', () => {
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByRole('button', { name: 'close' }))
    expect(vi.mocked(ConfirmCancelRunModal)).toHaveBeenCalled()
  })

  it('should launch protocol setup modules screen when click modules', () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: mockRobotSideAnalysis,
    } as any)
    when(vi.mocked(getProtocolModulesInfo))
      .calledWith(mockRobotSideAnalysis, flexDeckDefV5 as any)
      .thenReturn(mockProtocolModuleInfo)
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith([], mockProtocolModuleInfo)
      .thenReturn({ missingModuleIds: [], remainingAttachedModules: [] })
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByText('Deck hardware'))
    expect(vi.mocked(ProtocolSetupModulesAndDeck)).toHaveBeenCalled()
  })

  it('should launch protocol setup liquids screen when click liquids', () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: { ...mockRobotSideAnalysis, liquids: mockLiquids },
    } as any)
    when(vi.mocked(getProtocolModulesInfo))
      .calledWith(
        { ...mockRobotSideAnalysis, liquids: mockLiquids },
        flexDeckDefV5 as any
      )
      .thenReturn(mockProtocolModuleInfo)
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith([], mockProtocolModuleInfo)
      .thenReturn({ missingModuleIds: [], remainingAttachedModules: [] })
    render(`/runs/${RUN_ID}/setup/`)
    screen.getByText('1 initial liquid')
    fireEvent.click(screen.getByText('Liquids'))
    expect(vi.mocked(ProtocolSetupLiquids)).toHaveBeenCalled()
  })

  it('should launch view only parameters screen when click parameters', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    vi.mocked(useProtocolHasRunTimeParameters).mockReturnValue(true)
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: {
        ...mockRobotSideAnalysis,
        runTimeParameters: mockRunTimeParameterData,
      },
    } as any)
    when(vi.mocked(getProtocolModulesInfo))
      .calledWith(
        {
          ...mockRobotSideAnalysis,
          runTimeParameters: mockRunTimeParameterData,
        },
        flexDeckDefV5 as any
      )
      .thenReturn(mockProtocolModuleInfo)
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith([], mockProtocolModuleInfo)
      .thenReturn({ missingModuleIds: [], remainingAttachedModules: [] })
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByText('Parameters'))
    expect(vi.mocked(ViewOnlyParameters)).toHaveBeenCalled()
  })

  it('should launch LPC when clicked', () => {
    vi.mocked(useLPCDisabledReason).mockReturnValue(null)
    render(`/runs/${RUN_ID}/setup/`)
    screen.getByText(/Recommended/)
    screen.getByText(/1 offset applied/)
    fireEvent.click(screen.getByText('Labware Position Check'))
    expect(mockLaunchLPC).toHaveBeenCalled()
    screen.getByText('mock LPC Wizard')
  })

  it('should render a confirmation modal when heater-shaker is in a protocol and it is not shaking', () => {
    vi.mocked(useIsHeaterShakerInProtocol).mockReturnValue(true)
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    expect(vi.mocked(ConfirmAttachedModal)).toHaveBeenCalled()
  })
  it('should render a loading skeleton while awaiting a response from the server', () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: null,
    } as any)
    render(`/runs/${RUN_ID}/setup/`)
    expect(screen.getAllByTestId('Skeleton').length).toBeGreaterThan(0)
  })

  it('should render toast and make a button disabled when a robot door is open', () => {
    const mockOpenDoorStatus = {
      data: {
        status: 'open',
        doorRequiredClosedForProtocol: true,
      },
    }
    vi.mocked(useDoorQuery).mockReturnValue({ data: mockOpenDoorStatus } as any)
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    expect(MOCK_MAKE_SNACKBAR).toBeCalledWith(
      'Close the robot door before starting the run.'
    )
  })

  it('calls trackProtocolRunEvent when tapping play button', () => {
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    expect(mockTrackProtocolRunEvent).toBeCalledTimes(1)
    expect(mockTrackProtocolRunEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
      properties: {},
    })
  })

  it('should redirect to the protocols page when a run is stopped', () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_STOPPED)
    render(`/runs/${RUN_ID}/setup/`)
    expect(mockHistoryPush).toHaveBeenCalledWith('/protocols')
  })
})
