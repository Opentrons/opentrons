import * as React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { when } from 'vitest-when'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'

import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  instrumentsResponseLeftPipetteFixture,
} from '@opentrons/api-client'
import {
  useHost,
  useModulesQuery,
  usePipettesQuery,
  useDismissCurrentRunMutation,
  useDeleteRunMutation,
  useEstopQuery,
  useDoorQuery,
  useInstrumentsQuery,
  useRunCommandErrors,
} from '@opentrons/react-api-client'
import {
  getPipetteModelSpecs,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  simple_v6 as _uncastedSimpleV6Protocol,
  simple_v4 as noModulesProtocol,
} from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { useCloseCurrentRun } from '../../../../organisms/ProtocolUpload/hooks'
import { ConfirmCancelModal } from '../../../../organisms/RunDetails/ConfirmCancelModal'
import {
  useRunTimestamps,
  useRunControls,
  useRunStatus,
} from '../../../../organisms/RunTimeControl/hooks'
import {
  mockFailedRun,
  mockIdleUnstartedRun,
  mockPausedRun,
  mockRunningRun,
  mockStoppedRun,
  mockStopRequestedRun,
  mockSucceededRun,
} from '../../../../organisms/RunTimeControl/__fixtures__'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  ANALYTICS_PROTOCOL_RUN_ACTION,
} from '../../../../redux/analytics'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'
import { getRobotUpdateDisplayInfo } from '../../../../redux/robot-update'
import { getIsHeaterShakerAttached } from '../../../../redux/config'
import { getRobotSettings } from '../../../../redux/robot-settings'
import { getStoredProtocol } from '../../../../redux/protocol-storage'
import { storedProtocolData as storedProtocolDataFixture } from '../../../../redux/protocol-storage/__fixtures__'
import {
  useProtocolDetailsForRun,
  useProtocolAnalysisErrors,
  useTrackProtocolRunEvent,
  useRunCalibrationStatus,
  useRunCreatedAtTimestamp,
  useModuleCalibrationStatus,
  useUnmatchedModulesForProtocol,
  useIsRobotViewable,
  useIsFlex,
  useRobot,
} from '../../hooks'
import { useIsHeaterShakerInProtocol } from '../../../ModuleCard/hooks'
import { ConfirmAttachmentModal } from '../../../ModuleCard/ConfirmAttachmentModal'
import { RunProgressMeter } from '../../../RunProgressMeter'
import { formatTimestamp } from '../../utils'
import { ProtocolRunHeader } from '../ProtocolRunHeader'
import { HeaterShakerIsRunningModal } from '../../HeaterShakerIsRunningModal'
import { RunFailedModal } from '../RunFailedModal'
import { DISENGAGED, NOT_PRESENT } from '../../../EmergencyStop'
import { getIsFixtureMismatch } from '../../../../resources/deck_configuration/utils'
import { useDeckConfigurationCompatibility } from '../../../../resources/deck_configuration/hooks'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useMostRecentRunId } from '../../../ProtocolUpload/hooks/useMostRecentRunId'
import { useNotifyRunQuery, useCurrentRunId } from '../../../../resources/runs'
import {
  useDropTipWizardFlows,
  useTipAttachmentStatus,
  DropTipWizardFlows,
} from '../../../DropTipWizardFlows'
import {
  useErrorRecoveryFlows,
  ErrorRecoveryFlows,
} from '../../../ErrorRecoveryFlows'
import {
  ProtocolDropTipModal,
  useProtocolDropTipModal,
} from '../ProtocolDropTipModal'
import { ConfirmMissingStepsModal } from '../ConfirmMissingStepsModal'

import type { MissingSteps } from '../ProtocolRunSetup'
import type { UseQueryResult } from 'react-query'
import type { NavigateFunction } from 'react-router-dom'
import type { Mock } from 'vitest'
import type * as OpentronsSharedData from '@opentrons/shared-data'
import type * as OpentronsComponents from '@opentrons/components'
import type * as OpentronsApiClient from '@opentrons/api-client'
import type { State } from '../../../../redux/types'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<NavigateFunction>()
  return {
    ...reactRouterDom,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    Tooltip: vi.fn(({ children }) => <div>{children}</div>),
  }
})

vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsSharedData>()
  return {
    ...actual,
    getPipetteModelSpecs: vi.fn(),
  }
})

vi.mock('@opentrons/react-api-client')
vi.mock('../../../../organisms/ProtocolUpload/hooks')
vi.mock('../../../../organisms/RunDetails/ConfirmCancelModal')
vi.mock('../../../../organisms/RunTimeControl/hooks')
vi.mock('../../hooks')
vi.mock('../../HeaterShakerIsRunningModal')
vi.mock('../../../ModuleCard/ConfirmAttachmentModal')
vi.mock('../../../ModuleCard/hooks')
vi.mock('../../../RunProgressMeter')
vi.mock('../../../../redux/analytics')
vi.mock('../../../../redux/config')
vi.mock('../../../../redux/protocol-storage')
vi.mock('../RunFailedModal')
vi.mock('../../../../redux/robot-update/selectors')
vi.mock('../../../../redux/robot-settings/selectors')
vi.mock('../../../DropTipWizardFlows')
vi.mock('../../../../resources/deck_configuration/utils')
vi.mock('../../../../resources/deck_configuration/hooks')
vi.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
vi.mock('../../../ProtocolUpload/hooks/useMostRecentRunId')
vi.mock('../../../../resources/runs')
vi.mock('../../../ErrorRecoveryFlows')
vi.mock('../ProtocolDropTipModal')
vi.mock('../ConfirmMissingStepsModal')

const ROBOT_NAME = 'otie'
const RUN_ID = '95e67900-bc9f-4fbf-92c6-cc4d7226a51b'
const CREATED_AT = '03/03/2022 19:08:49'
const STARTED_AT = '2022-03-03T19:09:40.620530+00:00'
const COMPLETED_AT = '2022-03-03T19:39:53.620530+00:00'
const PROTOCOL_NAME = 'A Protocol for Otie'
const PROTOCOL_KEY = 'fakeProtocolKey'
const mockSettings = {
  id: 'enableDoorSafetySwitch',
  title: 'Enable Door Safety Switch',
  description: '',
  value: true,
  restart_required: false,
}
const MOCK_ROTOCOL_LIQUID_KEY = { liquids: [] }
const MOCK_ROBOT_SERIAL_NUMBER = 'OT123'

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as OpentronsSharedData.CompletedProtocolAnalysis

const PROTOCOL_DETAILS = {
  displayName: PROTOCOL_NAME,
  protocolData: simpleV6Protocol,
  protocolKey: PROTOCOL_KEY,
  isProtocolAnalyzing: false,
  robotType: 'OT-2 Standard' as const,
  isQuickTransfer: false,
}

const RUN_COMMAND_ERRORS = {
  data: {
    data: [
      {
        errorCode: '4000',
        errorType: 'test',
        isDefined: false,
        createdAt: '9-9-9',
        detail: 'blah blah',
        id: '123',
      },
    ],
    meta: {
      cursor: 0,
      pageLength: 1,
    },
  },
} as any

const mockMovingHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'speeding up',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

const mockEstopStatus = {
  data: {
    status: DISENGAGED,
    leftEstopPhysicalStatus: DISENGAGED,
    rightEstopPhysicalStatus: NOT_PRESENT,
  },
}
const mockDoorStatus = {
  data: {
    status: 'closed',
    doorRequiredClosedForProtocol: true,
  },
}
let mockMissingSteps: MissingSteps = []

const render = () => {
  return renderWithProviders(
    <BrowserRouter>
      <ProtocolRunHeader
        protocolRunHeaderRef={null}
        robotName={ROBOT_NAME}
        runId={RUN_ID}
        makeHandleJumpToStep={vi.fn(() => vi.fn())}
        missingSetupSteps={mockMissingSteps}
      />
    </BrowserRouter>,
    { i18nInstance: i18n }
  )
}
let mockTrackEvent: Mock
let mockTrackProtocolRunEvent: Mock
let mockCloseCurrentRun: Mock
let mockDetermineTipStatus: Mock

describe('ProtocolRunHeader', () => {
  beforeEach(() => {
    mockTrackEvent = vi.fn()
    mockTrackProtocolRunEvent = vi.fn(() => new Promise(resolve => resolve({})))
    mockCloseCurrentRun = vi.fn()
    mockDetermineTipStatus = vi.fn()
    mockMissingSteps = []
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    vi.mocked(ConfirmCancelModal).mockReturnValue(
      <div>Mock ConfirmCancelModal</div>
    )
    vi.mocked(RunProgressMeter).mockReturnValue(
      <div>Mock RunProgressMeter</div>
    )
    vi.mocked(HeaterShakerIsRunningModal).mockReturnValue(
      <div>Mock HeaterShakerIsRunningModal</div>
    )
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [] },
    } as any)
    vi.mocked(useDeleteRunMutation).mockReturnValue({
      deleteRun: vi.fn(),
    } as any)
    vi.mocked(usePipettesQuery).mockReturnValue({
      data: {
        data: {
          left: null,
          right: null,
        },
      },
    } as any)
    vi.mocked(getIsHeaterShakerAttached).mockReturnValue(false)
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    vi.mocked(ConfirmAttachmentModal).mockReturnValue(
      <div>mock confirm attachment modal</div>
    )
    vi.mocked(ConfirmMissingStepsModal).mockReturnValue(
      <div>mock missing steps modal</div>
    )
    when(vi.mocked(useProtocolAnalysisErrors)).calledWith(RUN_ID).thenReturn({
      analysisErrors: null,
    })
    vi.mocked(useIsHeaterShakerInProtocol).mockReturnValue(false)
    vi.mocked(getRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    when(vi.mocked(useCurrentRunId)).calledWith().thenReturn(RUN_ID)
    when(vi.mocked(useCloseCurrentRun)).calledWith().thenReturn({
      isClosingCurrentRun: false,
      closeCurrentRun: mockCloseCurrentRun,
    })
    when(vi.mocked(useRunControls))
      .calledWith(RUN_ID, expect.anything())
      .thenReturn({
        play: () => {},
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
    when(vi.mocked(useRunTimestamps)).calledWith(RUN_ID).thenReturn({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: null,
    })
    when(vi.mocked(useRunCreatedAtTimestamp))
      .calledWith(RUN_ID)
      .thenReturn(CREATED_AT)
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID, { staleTime: Infinity })
      .thenReturn({
        data: { data: mockIdleUnstartedRun },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useProtocolDetailsForRun))
      .calledWith(RUN_ID)
      .thenReturn(PROTOCOL_DETAILS)
    when(vi.mocked(useTrackProtocolRunEvent))
      .calledWith(RUN_ID, ROBOT_NAME)
      .thenReturn({
        trackProtocolRunEvent: mockTrackProtocolRunEvent,
      })
    when(vi.mocked(useDismissCurrentRunMutation))
      .calledWith()
      .thenReturn({
        dismissCurrentRun: vi.fn(),
      } as any)
    when(vi.mocked(useUnmatchedModulesForProtocol))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({ missingModuleIds: [], remainingAttachedModules: [] })
    when(vi.mocked(useRunCalibrationStatus))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({ complete: true })
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)
    when(vi.mocked(useModuleCalibrationStatus))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({ complete: true })
    vi.mocked(RunFailedModal).mockReturnValue(<div>mock RunFailedModal</div>)
    vi.mocked(useEstopQuery).mockReturnValue({ data: mockEstopStatus } as any)
    vi.mocked(useDoorQuery).mockReturnValue({ data: mockDoorStatus } as any)
    vi.mocked(getRobotSettings).mockReturnValue([mockSettings])
    vi.mocked(useInstrumentsQuery).mockReturnValue({ data: {} } as any)
    vi.mocked(useHost).mockReturnValue({} as any)
    vi.mocked(useTipAttachmentStatus).mockReturnValue({
      aPipetteWithTip: instrumentsResponseLeftPipetteFixture,
      areTipsAttached: true,
      determineTipStatus: mockDetermineTipStatus,
      resetTipStatus: vi.fn(),
    } as any)
    vi.mocked(useDropTipWizardFlows).mockReturnValue({
      showDTWiz: false,
      toggleDTWiz: vi.fn(),
    })
    vi.mocked(getPipetteModelSpecs).mockReturnValue('p10_single_v1' as any)
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn({
        ...noModulesProtocol,
        ...MOCK_ROTOCOL_LIQUID_KEY,
      } as any)
    vi.mocked(useRunCommandErrors).mockReturnValue(RUN_COMMAND_ERRORS)
    vi.mocked(useDeckConfigurationCompatibility).mockReturnValue([])
    vi.mocked(getIsFixtureMismatch).mockReturnValue(false)
    vi.mocked(useMostRecentRunId).mockReturnValue(RUN_ID)
    vi.mocked(useRobot).mockReturnValue({
      ...mockConnectableRobot,
      health: {
        ...mockConnectableRobot.health,
        robot_serial: MOCK_ROBOT_SERIAL_NUMBER,
      },
    })
    vi.mocked(useErrorRecoveryFlows).mockReturnValue({
      isERActive: false,
      failedCommand: {},
    } as any)
    vi.mocked(ErrorRecoveryFlows).mockReturnValue(
      <div>MOCK_ERROR_RECOVERY</div>
    )
    vi.mocked(useProtocolDropTipModal).mockReturnValue({
      onDTModalRemoval: vi.fn(),
      onDTModalSkip: vi.fn(),
      showDTModal: false,
      isDisabled: false,
    })
    vi.mocked(ProtocolDropTipModal).mockReturnValue(
      <div>MOCK_DROP_TIP_MODAL</div>
    )
    vi.mocked(DropTipWizardFlows).mockReturnValue(
      <div>MOCK_DROP_TIP_WIZARD_FLOWS</div>
    )
    when(getStoredProtocol)
      .calledWith({} as State, PROTOCOL_KEY)
      .thenReturn(storedProtocolDataFixture)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders a protocol name, run record id, status, and run time', () => {
    render()

    screen.getByText('A Protocol for Otie')
    screen.getByText('Run')
    screen.getByText('03/03/2022 19:08:49')
    screen.getByText('Status')
    screen.getByText('Not started')
    screen.getByText('Run Time')
  })

  it('links to a protocol details page', () => {
    render()

    const protocolNameLink = screen.getByRole('link', {
      name: 'A Protocol for Otie',
    })
    expect(protocolNameLink.getAttribute('href')).toBe(
      `/protocols/${PROTOCOL_DETAILS.protocolKey}`
    )
  })

  it('does not render link to protocol detail page if protocol key is absent', () => {
    when(vi.mocked(useProtocolDetailsForRun))
      .calledWith(RUN_ID)
      .thenReturn({ ...PROTOCOL_DETAILS, protocolKey: null })
    render()

    expect(
      screen.queryByRole('link', { name: 'A Protocol for Otie' })
    ).toBeNull()
  })

  it('does not render link to protocol detail page if stored protocol is absent', () => {
    vi.mocked(getStoredProtocol).mockReturnValue(null)
    render()

    expect(
      screen.queryByRole('link', { name: 'A Protocol for Otie' })
    ).toBeNull()
  })

  it('renders a disabled "Analyzing on robot" button if robot-side analysis is not complete', () => {
    when(vi.mocked(useProtocolDetailsForRun)).calledWith(RUN_ID).thenReturn({
      displayName: null,
      protocolData: null,
      protocolKey: null,
      isProtocolAnalyzing: true,
      robotType: 'OT-2 Standard',
      isQuickTransfer: false,
    })

    render()

    const button = screen.getByRole('button', { name: 'Analyzing on robot' })
    expect(button).toBeDisabled()
  })

  it('renders a start run button and cancel run button when run is ready to start', () => {
    render()

    screen.getByRole('button', { name: 'Start run' })
    screen.queryByText(formatTimestamp(STARTED_AT))
    screen.queryByText('Protocol start')
    screen.queryByText('Protocol end')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel run' }))
    screen.getByText('Mock ConfirmCancelModal')
    screen.getByText('Mock RunProgressMeter')
  })

  it('calls trackProtocolRunEvent when start run button clicked', () => {
    render()

    const button = screen.getByRole('button', { name: 'Start run' })
    fireEvent.click(button)
    expect(mockTrackProtocolRunEvent).toBeCalledTimes(1)
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
      properties: {},
    })
  })

  it('dismisses a current but canceled run and calls trackProtocolRunEvent', () => {
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_STOPPED)
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: { data: { ...mockIdleUnstartedRun, current: true } },
    } as UseQueryResult<OpentronsApiClient.Run>)
    render()
    expect(mockTrackProtocolRunEvent).toBeCalled()
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.FINISH,
      properties: {},
    })
  })

  it('disables the Start Run button with tooltip if calibration is incomplete', () => {
    when(vi.mocked(useRunCalibrationStatus))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({ complete: false })

    render()

    const button = screen.getByRole('button', { name: 'Start run' })
    expect(button).toBeDisabled()
    screen.getByText('Complete required steps in Setup tab')
  })

  it('disables the Start Run button with tooltip if a module is missing', () => {
    when(vi.mocked(useUnmatchedModulesForProtocol))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({
        missingModuleIds: ['temperatureModuleV1'],
        remainingAttachedModules: [],
      })

    render()
    const button = screen.getByRole('button', { name: 'Start run' })
    expect(button).toBeDisabled()
    screen.getByText('Complete required steps in Setup tab')
  })

  it('disables the Start Run button with tooltip if robot software update is available', () => {
    vi.mocked(getRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })

    render()
    const button = screen.getByRole('button', { name: 'Start run' })
    expect(button).toBeDisabled()
    screen.getByText(
      'A software update is available for this robot. Update to run protocols.'
    )
  })

  it('disables the Start Run button when a fixture is not configured or conflicted', () => {
    vi.mocked(useDeckConfigurationCompatibility).mockReturnValue([
      {
        cutoutId: 'cutoutA1',
        cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
        requiredAddressableAreas: ['D4'],
        compatibleCutoutFixtureIds: [
          STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
        ],
        missingLabwareDisplayName: null,
      },
    ])
    vi.mocked(getIsFixtureMismatch).mockReturnValue(true)
    render()
    const button = screen.getByRole('button', { name: 'Start run' })
    expect(button).toBeDisabled()
  })

  it('renders a pause run button, start time, and end time when run is running, and calls trackProtocolRunEvent when button clicked', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: { data: mockRunningRun },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_RUNNING)
    render()

    const button = screen.getByRole('button', { name: 'Pause run' })
    screen.getByText(formatTimestamp(STARTED_AT))
    screen.getByText('Protocol start')
    screen.getByText('Protocol end')
    fireEvent.click(button)
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.PAUSE,
    })
  })

  it('renders a cancel run button when running and shows a confirm cancel modal when clicked', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: { data: mockRunningRun },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_RUNNING)
    render()

    expect(screen.queryByText('Mock ConfirmCancelModal')).toBeFalsy()
    const cancelButton = screen.getByText('Cancel run')
    fireEvent.click(cancelButton)
    screen.getByText('Mock ConfirmCancelModal')
  })

  it('renders a Resume Run button and Cancel Run button when paused and call trackProtocolRunEvent when resume button clicked', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: { data: mockPausedRun },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_PAUSED)

    render()

    const button = screen.getByRole('button', { name: 'Resume run' })
    screen.getByRole('button', { name: 'Cancel run' })
    screen.getByText('Paused')
    fireEvent.click(button)
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.RESUME,
      properties: {},
    })
  })

  it('renders a disabled Canceling Run button and when stop requested', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: { data: mockStopRequestedRun },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_STOP_REQUESTED)

    render()

    const button = screen.getByRole('button', { name: 'Canceling Run' })
    expect(button).toBeDisabled()
    screen.getByText('Stop requested')
  })

  it('renders a disabled button and when the robot door is open', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: { data: mockRunningRun },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_BLOCKED_BY_OPEN_DOOR)

    const mockOpenDoorStatus = {
      data: { status: 'open', doorRequiredClosedForProtocol: true },
    }
    vi.mocked(useDoorQuery).mockReturnValue({ data: mockOpenDoorStatus } as any)

    render()

    const button = screen.getByRole('button', { name: 'Resume run' })
    expect(button).toBeDisabled()
    screen.getByText('Close robot door')
  })

  it('renders a Run Again button and end time when run has stopped and calls trackProtocolRunEvent when run again button clicked', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: { data: mockStoppedRun },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_STOPPED)
    when(vi.mocked(useRunTimestamps)).calledWith(RUN_ID).thenReturn({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: COMPLETED_AT,
    })

    render()

    const button = screen.getByText('Run again')
    screen.getByText('Canceled')
    screen.getByText(formatTimestamp(COMPLETED_AT))
    fireEvent.click(button)
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.AGAIN,
    })
  })

  it('renders a Run Again button and end time when run has failed and calls trackProtocolRunEvent when run again button clicked', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: { data: mockFailedRun },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_FAILED)
    when(vi.mocked(useRunTimestamps)).calledWith(RUN_ID).thenReturn({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: COMPLETED_AT,
    })

    render()

    const button = screen.getByText('Run again')
    screen.getByText('Failed')
    screen.getByText(formatTimestamp(COMPLETED_AT))
    fireEvent.click(button)
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.AGAIN,
    })
  })

  it('renders a Run Again button and end time when run has succeeded and calls trackProtocolRunEvent when run again button clicked', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: { data: mockSucceededRun },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_SUCCEEDED)
    when(vi.mocked(useRunTimestamps)).calledWith(RUN_ID).thenReturn({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: COMPLETED_AT,
    })

    render()

    const button = screen.getByText('Run again')
    screen.getByText('Completed')
    screen.getByText(formatTimestamp(COMPLETED_AT))
    fireEvent.click(button)
    expect(mockTrackEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: {
        sourceLocation: 'RunRecordDetail',
        robotSerialNumber: MOCK_ROBOT_SERIAL_NUMBER,
      },
    })
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.AGAIN,
    })
  })

  it('disables the Run Again button with tooltip for a completed run if the robot is busy', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: { data: mockSucceededRun },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_SUCCEEDED)
    when(vi.mocked(useRunTimestamps)).calledWith(RUN_ID).thenReturn({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: COMPLETED_AT,
    })
    when(vi.mocked(useCurrentRunId))
      .calledWith()
      .thenReturn('some other run id')

    render()

    const button = screen.getByRole('button', { name: 'Run again' })
    expect(button).toBeDisabled()
    screen.getByText('Robot is busy')
  })

  it('renders an alert when the robot door is open', () => {
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_BLOCKED_BY_OPEN_DOOR)
    render()

    screen.getByText('Close robot door to resume run')
  })

  it('renders a error detail link banner when run has failed', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: { data: mockFailedRun },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_FAILED)
    render()

    fireEvent.click(screen.getByText('View error details'))
    screen.getByText('mock RunFailedModal')
  })

  it('does not render banners when a run is resetting', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: { data: mockFailedRun },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_FAILED)
    when(vi.mocked(useRunControls))
      .calledWith(RUN_ID, expect.anything())
      .thenReturn({
        play: () => {},
        pause: () => {},
        stop: () => {},
        reset: () => {},
        resumeFromRecovery: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: true,
        isResumeRunFromRecoveryActionLoading: false,
      })
    render()

    expect(screen.queryByText('mock RunFailedModal')).not.toBeInTheDocument()
  })

  it('renders a clear protocol banner when run has been canceled', () => {
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_STOPPED)
    vi.mocked(useTipAttachmentStatus).mockReturnValue({
      areTipsAttached: false,
      determineTipStatus: mockDetermineTipStatus,
    } as any)
    render()

    screen.getByText('Run canceled.')
    expect(screen.queryByTestId('Banner_close-button')).not.toBeInTheDocument()
  })

  it('renders a clear protocol banner when run has succeeded', async () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: { data: mockSucceededRun },
    } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_SUCCEEDED)
    render()

    screen.getByText('Run completed with warnings.')
  })

  it('does not display the "run successful" banner if the successful run is not current', async () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: { data: { ...mockSucceededRun, current: false } },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_SUCCEEDED)
    render()

    expect(screen.queryByText('Run completed.')).not.toBeInTheDocument()
  })

  it('if a heater shaker is shaking, clicking on start run should render HeaterShakerIsRunningModal', async () => {
    when(vi.mocked(useRunStatus)).calledWith(RUN_ID).thenReturn(RUN_STATUS_IDLE)
    vi.mocked(useIsHeaterShakerInProtocol).mockReturnValue(true)
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [mockMovingHeaterShaker] },
    } as any)
    render()
    const button = screen.getByRole('button', { name: 'Start run' })
    fireEvent.click(button)
    await waitFor(() => {
      screen.getByText('Mock HeaterShakerIsRunningModal')
    })
  })

  it('does not render the confirm attachment modal when there is a heater shaker in the protocol and run is idle', () => {
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [mockHeaterShaker] },
    } as any)
    vi.mocked(useIsHeaterShakerInProtocol).mockReturnValue(true)
    render()

    const button = screen.getByRole('button', { name: 'Start run' })
    fireEvent.click(button)
    screen.getByText('mock confirm attachment modal')
    expect(mockTrackProtocolRunEvent).toBeCalledTimes(0)
  })

  it('renders the confirm attachment modal when there is a heater shaker in the protocol and the heater shaker is idle status and run is paused', () => {
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID)
      .thenReturn(RUN_STATUS_PAUSED)

    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [mockHeaterShaker] },
    } as any)
    vi.mocked(useIsHeaterShakerInProtocol).mockReturnValue(true)
    render()

    const button = screen.getByRole('button', { name: 'Resume run' })
    fireEvent.click(button)
    expect(screen.queryByText('mock confirm attachment modal')).toBeFalsy()
    expect(mockTrackProtocolRunEvent).toBeCalledTimes(1)
  })

  it('does NOT render confirm attachment modal when the user already confirmed the heater shaker is attached', () => {
    vi.mocked(getIsHeaterShakerAttached).mockReturnValue(true)
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [mockHeaterShaker] },
    } as any)
    vi.mocked(useIsHeaterShakerInProtocol).mockReturnValue(true)
    render()
    const button = screen.getByRole('button', { name: 'Start run' })
    fireEvent.click(button)
    expect(vi.mocked(useRunControls)).toHaveBeenCalled()
  })

  it('renders analysis error modal if there is an analysis error', () => {
    when(vi.mocked(useProtocolAnalysisErrors))
      .calledWith(RUN_ID)
      .thenReturn({
        analysisErrors: [
          {
            id: 'error_id',
            detail: 'protocol analysis error',
            errorType: 'analysis',
            createdAt: '100000',
          },
        ],
      })
    render()
    screen.getByText('protocol analysis error')
  })

  it('renders analysis error banner if there is an analysis error', () => {
    when(vi.mocked(useProtocolAnalysisErrors))
      .calledWith(RUN_ID)
      .thenReturn({
        analysisErrors: [
          {
            id: 'error_id',
            detail: 'protocol analysis error',
            errorType: 'analysis',
            createdAt: '100000',
          },
        ],
      })
    render()
    screen.getByText('Protocol analysis failed.')
  })

  it('renders the devices page when robot is not viewable but protocol is loaded', async () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(false)
    render()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/devices')
    })
  })

  it('renders door close banner when the robot door is open', () => {
    const mockOpenDoorStatus = {
      data: { status: 'open', doorRequiredClosedForProtocol: true },
    }
    vi.mocked(useDoorQuery).mockReturnValue({ data: mockOpenDoorStatus } as any)
    render()
    screen.getByText('Close the robot door before starting the run.')
  })

  it('should render door close banner when door is open and enabled safety door switch is on - OT-2', () => {
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(false)
    const mockOpenDoorStatus = {
      data: { status: 'open', doorRequiredClosedForProtocol: true },
    }
    vi.mocked(useDoorQuery).mockReturnValue({ data: mockOpenDoorStatus } as any)
    render()
    screen.getByText('Close the robot door before starting the run.')
  })

  it('should not render door close banner when door is open and enabled safety door switch is off - OT-2', () => {
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(false)
    const mockOffSettings = { ...mockSettings, value: false }
    vi.mocked(getRobotSettings).mockReturnValue([mockOffSettings])
    const mockOpenDoorStatus = {
      data: { status: 'open', doorRequiredClosedForProtocol: true },
    }
    vi.mocked(useDoorQuery).mockReturnValue({ data: mockOpenDoorStatus } as any)
    render()
    expect(
      screen.queryByText('Close the robot door before starting the run.')
    ).not.toBeInTheDocument()
  })

  it('renders the drop tip modal initially when the run ends if tips are attached', () => {
    vi.mocked(useProtocolDropTipModal).mockReturnValue({
      onDTModalRemoval: vi.fn(),
      onDTModalSkip: vi.fn(),
      showDTModal: true,
      isDisabled: false,
    })

    render()

    screen.getByText('MOCK_DROP_TIP_MODAL')
  })

  it('does not render the drop tip modal when the run is not over', async () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: {
          data: {
            ...mockIdleUnstartedRun,
            current: true,
            status: RUN_STATUS_IDLE,
          },
        },
      } as UseQueryResult<OpentronsApiClient.Run>)
    when(vi.mocked(useRunStatus)).calledWith(RUN_ID).thenReturn(RUN_STATUS_IDLE)

    render()
    await waitFor(() => {
      expect(mockDetermineTipStatus).not.toHaveBeenCalled()
    })
  })

  it('renders Error Recovery Flows when isERActive is true', () => {
    vi.mocked(useErrorRecoveryFlows).mockReturnValue({
      isERActive: true,
      failedCommand: {},
    } as any)

    render()
    screen.getByText('MOCK_ERROR_RECOVERY')
  })

  it('renders DropTipWizardFlows when conditions are met', () => {
    vi.mocked(useDropTipWizardFlows).mockReturnValue({
      showDTWiz: true,
      toggleDTWiz: vi.fn(),
    })

    render()
    screen.getByText('MOCK_DROP_TIP_WIZARD_FLOWS')
  })
})
