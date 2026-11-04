import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { RUN_STATUS_STOPPED } from '@opentrons/api-client'
import {
  useAddCameraSettingsToRunMutation,
  useAllPipetteOffsetCalibrationsQuery,
  useCamera,
  useInstrumentsQuery,
  useModulesQuery,
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import {
  FLEX_ROBOT_TYPE,
  flexDeckDefV5,
  getDeckDefFromRobotType,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useScrollPosition } from '/app/local-resources/dom-utils'
import { getIncompleteInstrumentCount } from '/app/local-resources/instruments'
import { mockRobotSideAnalysis } from '/app/molecules/Command/__fixtures__'
import {
  NOT_CONFIGURED,
  useIsDoorOpen,
} from '/app/organisms/DoorOpenControl/useIsDoorOpen'
import {
  useApplyOffsets,
  useLPCFlows,
} from '/app/organisms/LabwarePositionCheck'
import { useIsHeaterShakerInProtocol } from '/app/organisms/ModuleCard/hooks'
import {
  getUnmatchedModulesForProtocol,
  ProtocolSetupLabware,
  ProtocolSetupModulesAndDeck,
  ProtocolSetupOffsets,
  ProtocolSetupStepSkeleton,
  ProtocolSetupTitleSkeleton,
  ViewOnlyParameters,
} from '/app/organisms/ODD/ProtocolSetup'
import { mockRunTimeParameterData } from '/app/organisms/ODD/ProtocolSetup/__fixtures__'
import { ProtocolSetupCamera } from '/app/organisms/ODD/ProtocolSetup/ProtocolSetupCamera'
import { mockProtocolModuleInfo } from '/app/organisms/ODD/ProtocolSetup/ProtocolSetupInstruments/__fixtures__'
import { ConfirmCancelRunModal } from '/app/organisms/ODD/RunningProtocol'
import {
  useProtocolHasRunTimeParameters,
  useRunControls,
} from '/app/organisms/RunTimeControl/hooks'
import { useToaster } from '/app/organisms/ToasterOven'
import {
  useCameraAnalytics,
  useTrackProtocolRunEvent,
} from '/app/redux-resources/analytics'
import { useRobotType } from '/app/redux-resources/robots'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '/app/redux/analytics'
import { getLocalRobot } from '/app/redux/discovery'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import { mockHeaterShaker } from '/app/redux/modules/__fixtures__'
import {
  getCameraUsageState,
  selectAreOffsetsApplied,
  selectCountMissingLSOffsetsWithoutDefault,
  selectIsAnyNecessaryDefaultOffsetMissing,
  selectOffsetSource,
  selectTotalCountLocationSpecificOffsets,
} from '/app/redux/protocol-runs'
import { useDeckConfigurationCompatibility } from '/app/resources/deck_configuration/hooks'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration/useNotifyDeckConfigurationQuery'
import { useNotifyCurrentMaintenanceRun } from '/app/resources/maintenance_runs'
import { useAttachedModules } from '/app/resources/modules'
import {
  useLPCDisabledReason,
  useModuleCalibrationStatus,
  useNotifyRunQuery,
  useProtocolAnalysisErrors,
  useRunCreatedAtTimestamp,
} from '/app/resources/runs'
import { getProtocolModulesInfo } from '/app/transformations/analysis'

import { ProtocolSetup } from '../'
import { ConfirmAttachedModal } from '../ConfirmAttachedModal'
import { ConfirmSetupStepsCompleteModal } from '../ConfirmSetupStepsCompleteModal'

import type { UseQueryResult } from 'react-query'
import type { NavigateFunction } from 'react-router-dom'
import type * as SharedData from '@opentrons/shared-data'

let mockNavigate = vi.fn()

vi.mock('@opentrons/shared-data', async importOriginal => {
  const sharedData = await importOriginal<typeof SharedData>()
  return {
    ...sharedData,
    getDeckDefFromRobotType: vi.fn(),
  }
})

vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<NavigateFunction>()
  return {
    ...reactRouterDom,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@opentrons/react-api-client')
vi.mock('/app/organisms/LegacyLabwarePositionCheck/useLaunchLegacyLPC')
vi.mock('/app/organisms/ODD/ProtocolSetup', async importOriginal => {
  const ACTUALS = ['ProtocolSetupStep']
  const actual = await importOriginal<object>()
  return Object.fromEntries(
    Object.entries(actual).map(([k, v]) =>
      ACTUALS.includes(k) ? [k, v] : [k, vi.fn()]
    )
  )
})

vi.mock('/app/transformations/analysis')
vi.mock('/app/organisms/ODD/RunningProtocol')
vi.mock('/app/organisms/RunTimeControl/hooks')
vi.mock('/app/organisms/ModuleCard/hooks')
vi.mock('/app/redux/discovery/selectors')
vi.mock('../ConfirmAttachedModal')
vi.mock('/app/organisms/ToasterOven')
vi.mock('/app/resources/runs')
vi.mock(
  '/app/resources/deck_configuration/hooks/useDeckConfigurationCompatibility'
)
vi.mock('/app/resources/deck_configuration/useNotifyDeckConfigurationQuery')
vi.mock('../ConfirmSetupStepsCompleteModal')
vi.mock('/app/redux-resources/analytics')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/resources/modules')
vi.mock('/app/local-resources/dom-utils')
vi.mock('/app/organisms/LabwarePositionCheck')
vi.mock('/app/redux/protocol-runs')
vi.mock('/app/resources/maintenance_runs')
vi.mock('/app/local-resources/instruments')
vi.mock('/app/organisms/DoorOpenControl/useIsDoorOpen')
vi.mock('/app/organisms/LabwarePositionCheck')
vi.mock('/app/organisms/ODD/ProtocolSetup/ProtocolSetupCamera')

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Routes>
        <Route path="/runs/:runId/setup/" element={<ProtocolSetup />} />
      </Routes>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const MockProtocolSetupLabware = vi.mocked(ProtocolSetupLabware)
const MockProtocolSetupOffsets = vi.mocked(ProtocolSetupOffsets)
const MockProtocolSetupCamera = vi.mocked(ProtocolSetupCamera)
const MockProtocolSetupTitleSkeleton = vi.mocked(ProtocolSetupTitleSkeleton)
const MockProtocolSetupStepSkeleton = vi.mocked(ProtocolSetupStepSkeleton)
const MockConfirmSetupStepsCompleteModal = vi.mocked(
  ConfirmSetupStepsCompleteModal
)
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
const mockEmptyAnalysis = {
  modules: [],
  labware: [],
  pipettes: [],
  commands: [],
} as unknown as SharedData.CompletedProtocolAnalysis

const mockPlay = vi.fn()
const mockOffset = {
  id: 'fake_labware_offset',
  createdAt: 'timestamp',
  definitionUri: 'fake_def_uri',
  location: { slotName: 'A1' },
  vector: { x: 1, y: 2, z: 3 },
}

const mockDoorStatus = {
  isDoorOpen: false,
  moduleDoorLocation: null,
}
const mockFixture = {
  cutoutId: 'cutoutD1',
  cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
}

const MOCK_MAKE_SNACKBAR = vi.fn()
const mockTrackProtocolRunEvent = vi.fn()
// TODO(jh, 04-23-25): Some of these tests are failing (the skipped ones) due to circular
//  imports. Investigate further.

describe('ProtocolSetup', () => {
  let mockLaunchLPC = vi.fn()

  beforeEach(() => {
    mockLaunchLPC = vi.fn()
    mockNavigate = vi.fn()

    MockProtocolSetupLabware.mockImplementation(
      vi.fn(({ setIsConfirmed, setSetupScreen }) => {
        setIsConfirmed(true)
        setSetupScreen('prepare to run')
        return <div>Mock ProtocolSetupLabware</div>
      })
    )
    MockProtocolSetupOffsets.mockImplementation(
      vi.fn(({ setIsConfirmed, setSetupScreen }) => {
        setIsConfirmed(true)
        setSetupScreen('prepare to run')
        return <div>Mock ProtocolSetupOffsets</div>
      })
    )
    MockConfirmSetupStepsCompleteModal.mockReturnValue(
      <div>Mock ConfirmSetupStepsCompleteModal</div>
    )
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: { data: { id: 'mock-id' } },
    } as any)
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
        isRunControlLoading: false,
      })
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
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: {
          protocolId: PROTOCOL_ID,
          labwareOffsets: [mockOffset],
          status: RUN_STATUS_STOPPED,
        },
      },
    } as any)
    vi.mocked(useCamera).mockReturnValue({ data: {} } as any)
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
    vi.mocked(useIsHeaterShakerInProtocol).mockReturnValue(false)
    when(vi.mocked(useIsDoorOpen))
      .calledWith(ROBOT_NAME)
      .thenReturn(mockDoorStatus)
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [mockHeaterShaker] },
    } as any)
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [mockFixture],
    } as UseQueryResult<SharedData.DeckConfiguration>)
    when(vi.mocked(useToaster))
      .calledWith()
      .thenReturn({
        makeSnackbar: MOCK_MAKE_SNACKBAR,
      } as unknown as any)
    vi.mocked(useDeckConfigurationCompatibility).mockReturnValue([])
    vi.mocked(useProtocolHasRunTimeParameters).mockReturnValue(false)
    when(vi.mocked(useTrackProtocolRunEvent))
      .calledWith(RUN_ID, ROBOT_NAME)
      .thenReturn({ trackProtocolRunEvent: mockTrackProtocolRunEvent })

    when(vi.mocked(useCameraAnalytics))
      .calledWith({ source: 'runRecord', robotType: 'OT-3 Standard' })
      .thenReturn({
        reportCameraSettings: vi.fn(),
        reportCameraEnablementSettings: vi.fn(),
        reportPhotoAccessUsage: vi.fn(),
        reportImageCaptureUsage: vi.fn(),
        reportLiveFeedUsage: vi.fn(),
        reportLiveFeedDuration: vi.fn(),
      })
    vi.mocked(useScrollPosition).mockReturnValue({
      isScrolled: false,
      scrollRef: {} as any,
    })
    vi.mocked(useLPCFlows).mockReturnValue({ launchLPC: mockLaunchLPC } as any)
    vi.mocked(selectAreOffsetsApplied).mockImplementation(() => () => true)
    vi.mocked(selectTotalCountLocationSpecificOffsets).mockImplementation(
      () => () => 3
    )
    vi.mocked(selectCountMissingLSOffsetsWithoutDefault).mockImplementation(
      () => () => 1
    )
    vi.mocked(selectIsAnyNecessaryDefaultOffsetMissing).mockImplementation(
      () => () => false
    )
    vi.mocked(selectOffsetSource).mockImplementation(() => () => 'fromDatabase')
    vi.mocked(useApplyOffsets).mockReturnValue({
      isApplyingOffsets: false,
      applyOffsets: vi.fn(),
    })
    vi.mocked(useAddCameraSettingsToRunMutation).mockReturnValue({
      addCameraSettingsToRun: vi.fn(),
    } as any)
    vi.mocked(getCameraUsageState).mockReturnValue({ enabled: true } as any)
  })

  it('should render text, image, and buttons', () => {
    render(`/runs/${RUN_ID}/setup/`)
    screen.getByText('Prepare to run')
    screen.getByText('Instruments')
    screen.getByText('Deck hardware')
    screen.getByText('Labware & Liquids')
    screen.getByText('Labware Offsets')
  })

  it.skip('should play protocol when click play button', () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: mockRobotSideAnalysis,
    } as any)
    when(vi.mocked(getProtocolModulesInfo))
      .calledWith(mockRobotSideAnalysis, flexDeckDefV5 as any)
      .thenReturn(mockProtocolModuleInfo)
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith([], mockProtocolModuleInfo)
      .thenReturn({ missingModuleIds: [], remainingAttachedModules: [] })
    vi.mocked(getIncompleteInstrumentCount).mockReturnValue(0)
    MockProtocolSetupLabware.mockImplementation(
      vi.fn(({ setIsConfirmed, setSetupScreen }) => {
        setIsConfirmed(true)
        setSetupScreen('prepare to run')
        return <div>Mock ProtocolSetupLabware</div>
      })
    )
    MockProtocolSetupOffsets.mockImplementation(
      vi.fn(({ setIsConfirmed, setSetupScreen }) => {
        setIsConfirmed(true)
        setSetupScreen('prepare to run')
        return <div>Mock ProtocolSetupOffsets</div>
      })
    )
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByText('Labware & Liquids'))
    expect(mockPlay).toBeCalledTimes(0)
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    expect(MockConfirmSetupStepsCompleteModal).toBeCalledTimes(0)
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

  it('should launch protocol setup labware screen when click labware', () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: mockRobotSideAnalysis,
    } as any)
    when(vi.mocked(getProtocolModulesInfo))
      .calledWith(mockRobotSideAnalysis, flexDeckDefV5 as any)
      .thenReturn(mockProtocolModuleInfo)
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith([], mockProtocolModuleInfo)
      .thenReturn({ missingModuleIds: [], remainingAttachedModules: [] })
    render(`/runs/${RUN_ID}/setup`)
    fireEvent.click(screen.getByTestId('SetupButton_Labware & Liquids'))
    expect(MockProtocolSetupLabware).toHaveBeenCalled()
  })

  it('should launch view only parameters screen when click parameters', () => {
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

  it('should launch offsets screen when click offsets', () => {
    MockProtocolSetupOffsets.mockImplementation(
      vi.fn(() => <div>Mock ProtocolSetupOffsets</div>)
    )
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByText('Labware Offsets'))
    expect(MockProtocolSetupOffsets).toHaveBeenCalled()
    screen.getByText(/Mock ProtocolSetupOffsets/)
  })

  it('should launch camera screen when click camera', () => {
    MockProtocolSetupCamera.mockImplementation(
      vi.fn(() => <div>Mock ProtocolSetupCamera</div>)
    )
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByText('Camera'))
    expect(MockProtocolSetupOffsets).toHaveBeenCalled()
    screen.getByText(/Mock ProtocolSetupCamera/)
  })

  it.skip('should render a confirmation modal when heater-shaker is in a protocol and it is not shaking', () => {
    vi.mocked(useIsHeaterShakerInProtocol).mockReturnValue(true)
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: mockRobotSideAnalysis,
    } as any)
    when(vi.mocked(getProtocolModulesInfo))
      .calledWith(mockRobotSideAnalysis, flexDeckDefV5 as any)
      .thenReturn(mockProtocolModuleInfo)
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith([], mockProtocolModuleInfo)
      .thenReturn({ missingModuleIds: [], remainingAttachedModules: [] })
    vi.mocked(getIncompleteInstrumentCount).mockReturnValue(0)
    MockProtocolSetupLabware.mockImplementation(
      vi.fn(({ setIsConfirmed, setSetupScreen }) => {
        setIsConfirmed(true)
        setSetupScreen('prepare to run')
        return <div>Mock ProtocolSetupLabware</div>
      })
    )
    MockProtocolSetupOffsets.mockImplementation(
      vi.fn(({ setSetupScreen }) => {
        setSetupScreen('prepare to run')
        return <div>Mock ProtocolSetupOffsets</div>
      })
    )
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByText('Labware Offsets'))
    fireEvent.click(screen.getByText('Labware & Liquids'))
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    expect(vi.mocked(ConfirmAttachedModal)).toHaveBeenCalled()
  })
  it.skip('should go from skip steps to heater-shaker modal', () => {
    vi.mocked(useIsHeaterShakerInProtocol).mockReturnValue(true)
    MockConfirmSetupStepsCompleteModal.mockImplementation(
      ({ onConfirmClick }) => {
        onConfirmClick()
        return <div>Mock ConfirmSetupStepsCompleteModal</div>
      }
    )
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    expect(MockConfirmSetupStepsCompleteModal).toHaveBeenCalled()
    expect(vi.mocked(ConfirmAttachedModal)).toHaveBeenCalled()
  })
  it('should render a loading skeleton while awaiting a response from the server', () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: null,
    } as any)
    MockProtocolSetupTitleSkeleton.mockReturnValue(<div>SKELETON</div>)
    MockProtocolSetupStepSkeleton.mockReturnValue(<div>SKELETON</div>)
    render(`/runs/${RUN_ID}/setup/`)
    expect(screen.getAllByText('SKELETON').length).toBeGreaterThanOrEqual(2)
  })

  it('should render toast and make a button disabled when a robot door is open', async () => {
    const mockOpenDoorStatus = {
      isDoorOpen: true,
      moduleDoorLocation: null,
    }
    when(vi.mocked(useIsDoorOpen))
      .calledWith(ROBOT_NAME)
      .thenReturn(mockOpenDoorStatus)
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    // onPlay runs through the access-control gate (async) before the snackbar
    // call lands, so await the side effect rather than asserting synchronously.
    await waitFor(() => {
      expect(MOCK_MAKE_SNACKBAR).toBeCalledWith(
        'Close the robot door before starting the run.'
      )
    })
  })
  it('should render toast and make a button disabled when a stacker door is open', async () => {
    const mockOpenDoorStatus = {
      isDoorOpen: true,
      moduleDoorLocation: NOT_CONFIGURED,
    }
    when(vi.mocked(useIsDoorOpen))
      .calledWith(ROBOT_NAME)
      .thenReturn(mockOpenDoorStatus)
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    await waitFor(() => {
      expect(MOCK_MAKE_SNACKBAR).toBeCalledWith(
        'A stacker door is open. Close the stacker door before starting the run.'
      )
    })
  })

  it.skip('calls trackProtocolRunEvent when tapping play button', () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: mockRobotSideAnalysis,
    } as any)
    when(vi.mocked(getProtocolModulesInfo))
      .calledWith(mockRobotSideAnalysis, flexDeckDefV5 as any)
      .thenReturn(mockProtocolModuleInfo)
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith([], mockProtocolModuleInfo)
      .thenReturn({ missingModuleIds: [], remainingAttachedModules: [] })
    vi.mocked(getIncompleteInstrumentCount).mockReturnValue(0)
    render(`/runs/${RUN_ID}/setup/`)

    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    expect(mockTrackProtocolRunEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
      properties: {},
    })
  })

  it('should redirect to the protocols page when a run is stopped', () => {
    render(`/runs/${RUN_ID}/setup/`)
    expect(mockNavigate).toHaveBeenCalledWith('/protocols')
  })

  it('should show action needed when modules are not calibrated', () => {
    vi.mocked(useModuleCalibrationStatus).mockReturnValue({ complete: false })
    render(`/runs/${RUN_ID}/setup/`)
    expect(screen.getByText('Action needed')).toBeInTheDocument()
  })
})
