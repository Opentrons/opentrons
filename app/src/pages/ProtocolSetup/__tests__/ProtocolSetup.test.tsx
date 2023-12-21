import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  useAllPipetteOffsetCalibrationsQuery,
  useInstrumentsQuery,
  useRunQuery,
  useProtocolQuery,
  useDoorQuery,
  useModulesQuery,
  useDeckConfigurationQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'
import { mockHeaterShaker } from '@opentrons/app/src/redux/modules/__fixtures__'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'
import ot3StandardDeckDef from '@opentrons/shared-data/deck/definitions/4/ot3_standard.json'

import { i18n } from '@opentrons/app/src/i18n'
import { useToaster } from '@opentrons/app/src/organisms/ToasterOven'
import { mockRobotSideAnalysis } from '@opentrons/app/src/organisms/CommandText/__fixtures__'
import {
  useAttachedModules,
  useLPCDisabledReason,
  useRunCreatedAtTimestamp,
  useModuleCalibrationStatus,
  useRobotType,
} from '@opentrons/app/src/organisms/Devices/hooks'
import { getLocalRobot } from '@opentrons/app/src/redux/discovery'
import { ProtocolSetupLiquids } from '@opentrons/app/src/organisms/ProtocolSetupLiquids'
import { getProtocolModulesInfo } from '@opentrons/app/src/organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { ProtocolSetupModulesAndDeck } from '@opentrons/app/src/organisms/ProtocolSetupModulesAndDeck'
import { getUnmatchedModulesForProtocol } from '@opentrons/app/src/organisms/ProtocolSetupModulesAndDeck/utils'
import { useLaunchLPC } from '@opentrons/app/src/organisms/LabwarePositionCheck/useLaunchLPC'
import { ConfirmCancelRunModal } from '@opentrons/app/src/organisms/OnDeviceDisplay/RunningProtocol'
import { mockProtocolModuleInfo } from '@opentrons/app/src/organisms/ProtocolSetupInstruments/__fixtures__'
import {
  useRunControls,
  useRunStatus,
} from '@opentrons/app/src/organisms/RunTimeControl/hooks'
import { useIsHeaterShakerInProtocol } from '@opentrons/app/src/organisms/ModuleCard/hooks'
import { useDeckConfigurationCompatibility } from '@opentrons/app/src/resources/deck_configuration/hooks'
import { ConfirmAttachedModal } from '@opentrons/app/src/pages/ProtocolSetup/ConfirmAttachedModal'
import { ProtocolSetup } from '@opentrons/app/src/pages/ProtocolSetup'

import type { UseQueryResult } from 'react-query'
import type {
  DeckConfiguration,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'

// Mock IntersectionObserver
class IntersectionObserver {
  observe = jest.fn()
  disconnect = jest.fn()
  unobserve = jest.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
})

jest.mock('@opentrons/shared-data/js/helpers')
jest.mock('@opentrons/react-api-client')
jest.mock('../../../organisms/LabwarePositionCheck/useLaunchLPC')
jest.mock('../../../organisms/Devices/hooks')
jest.mock(
  '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
jest.mock('../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo')
jest.mock('../../../organisms/ProtocolSetupModulesAndDeck')
jest.mock('../../../organisms/ProtocolSetupModulesAndDeck/utils')
jest.mock('../../../organisms/OnDeviceDisplay/RunningProtocol')
jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock('../../../organisms/ProtocolSetupLiquids')
jest.mock('../../../organisms/ModuleCard/hooks')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../ConfirmAttachedModal')
jest.mock('../../../organisms/ToasterOven')
jest.mock('../../../resources/deck_configuration/hooks')

const mockGetDeckDefFromRobotType = getDeckDefFromRobotType as jest.MockedFunction<
  typeof getDeckDefFromRobotType
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseRunCreatedAtTimestamp = useRunCreatedAtTimestamp as jest.MockedFunction<
  typeof useRunCreatedAtTimestamp
>
const mockGetProtocolModulesInfo = getProtocolModulesInfo as jest.MockedFunction<
  typeof getProtocolModulesInfo
>
const mockProtocolSetupModulesAndDeck = ProtocolSetupModulesAndDeck as jest.MockedFunction<
  typeof ProtocolSetupModulesAndDeck
>
const mockGetUnmatchedModulesForProtocol = getUnmatchedModulesForProtocol as jest.MockedFunction<
  typeof getUnmatchedModulesForProtocol
>
const mockConfirmCancelRunModal = ConfirmCancelRunModal as jest.MockedFunction<
  typeof ConfirmCancelRunModal
>
const mockUseRunControls = useRunControls as jest.MockedFunction<
  typeof useRunControls
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockProtocolSetupLiquids = ProtocolSetupLiquids as jest.MockedFunction<
  typeof ProtocolSetupLiquids
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>
const mockUseAllPipetteOffsetCalibrationsQuery = useAllPipetteOffsetCalibrationsQuery as jest.MockedFunction<
  typeof useAllPipetteOffsetCalibrationsQuery
>
const mockUseLaunchLPC = useLaunchLPC as jest.MockedFunction<
  typeof useLaunchLPC
>
const mockUseLPCDisabledReason = useLPCDisabledReason as jest.MockedFunction<
  typeof useLPCDisabledReason
>
const mockUseIsHeaterShakerInProtocol = useIsHeaterShakerInProtocol as jest.MockedFunction<
  typeof useIsHeaterShakerInProtocol
>
const mockUseRobotType = useRobotType as jest.MockedFunction<
  typeof useRobotType
>
const mockConfirmAttachedModal = ConfirmAttachedModal as jest.MockedFunction<
  typeof ConfirmAttachedModal
>
const mockUseDoorQuery = useDoorQuery as jest.MockedFunction<
  typeof useDoorQuery
>
const mockUseModulesQuery = useModulesQuery as jest.MockedFunction<
  typeof useModulesQuery
>
const mockUseProtocolAnalysisAsDocumentQuery = useProtocolAnalysisAsDocumentQuery as jest.MockedFunction<
  typeof useProtocolAnalysisAsDocumentQuery
>
const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>
const mockUseToaster = useToaster as jest.MockedFunction<typeof useToaster>
const mockUseModuleCalibrationStatus = useModuleCalibrationStatus as jest.MockedFunction<
  typeof useModuleCalibrationStatus
>
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>
const mockUseDeckConfigurationCompatibility = useDeckConfigurationCompatibility as jest.MockedFunction<
  typeof useDeckConfigurationCompatibility
>

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
} as unknown) as CompletedProtocolAnalysis
const mockLiquids = [
  {
    id: 'm',
    displayName: 'mock',
    description: 'Mock liquid',
  },
]

const mockPlay = jest.fn()
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

const MOCK_MAKE_SNACKBAR = jest.fn()

describe('ProtocolSetup', () => {
  let mockLaunchLPC: jest.Mock
  beforeEach(() => {
    mockLaunchLPC = jest.fn()
    mockUseLPCDisabledReason.mockReturnValue(null)
    mockUseAttachedModules.mockReturnValue([])
    mockProtocolSetupModulesAndDeck.mockReturnValue(
      <div>Mock ProtocolSetupModulesAndDeck</div>
    )
    mockProtocolSetupLiquids.mockReturnValue(
      <div>Mock ProtocolSetupLiquids</div>
    )
    mockConfirmCancelRunModal.mockReturnValue(
      <div>Mock ConfirmCancelRunModal</div>
    )
    mockUseModuleCalibrationStatus.mockReturnValue({ complete: true })
    mockGetLocalRobot.mockReturnValue({ name: ROBOT_NAME } as any)
    when(mockUseRobotType)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(FLEX_ROBOT_TYPE)
    when(mockUseRunControls)
      .calledWith(RUN_ID)
      .mockReturnValue({
        play: mockPlay,
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
      })
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_IDLE)
    mockUseProtocolAnalysisAsDocumentQuery.mockReturnValue({
      data: mockEmptyAnalysis,
    } as any)
    when(mockUseRunCreatedAtTimestamp)
      .calledWith(RUN_ID)
      .mockReturnValue(CREATED_AT)
    when(mockGetProtocolModulesInfo)
      .calledWith(mockEmptyAnalysis, ot3StandardDeckDef as any)
      .mockReturnValue([])
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith([], [])
      .mockReturnValue({ missingModuleIds: [], remainingAttachedModules: [] })
    when(mockGetDeckDefFromRobotType)
      .calledWith('OT-3 Standard')
      .mockReturnValue(ot3StandardDeckDef as any)
    when(mockUseRunQuery)
      .calledWith(RUN_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: {
          data: {
            protocolId: PROTOCOL_ID,
            labwareOffsets: [mockOffset],
          },
        },
      } as any)
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { metadata: { protocolName: PROTOCOL_NAME } } },
      } as any)
    when(mockUseInstrumentsQuery)
      .calledWith()
      .mockReturnValue({
        data: {
          data: [mockLeftPipetteData, mockRightPipetteData, mockGripperData],
        },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith()
      .mockReturnValue({ data: { data: [] } } as any)
    when(mockUseLaunchLPC)
      .calledWith(RUN_ID, FLEX_ROBOT_TYPE, PROTOCOL_NAME)
      .mockReturnValue({
        launchLPC: mockLaunchLPC,
        LPCWizard: <div>mock LPC Wizard</div>,
      })
    mockUseIsHeaterShakerInProtocol.mockReturnValue(false)
    mockConfirmAttachedModal.mockReturnValue(
      <div>mock ConfirmAttachedModal</div>
    )
    mockUseDoorQuery.mockReturnValue({ data: mockDoorStatus } as any)
    mockUseModulesQuery.mockReturnValue({
      data: { data: [mockHeaterShaker] },
    } as any)
    mockUseDeckConfigurationQuery.mockReturnValue({
      data: [mockFixture],
    } as UseQueryResult<DeckConfiguration>)
    when(mockUseToaster)
      .calledWith()
      .mockReturnValue(({
        makeSnackbar: MOCK_MAKE_SNACKBAR,
      } as unknown) as any)
    when(mockUseDeckConfigurationCompatibility).mockReturnValue([])
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render text, image, and buttons', () => {
    render(`/runs/${RUN_ID}/setup/`)
    screen.getByText('Prepare to run')
    screen.getByText('Instruments')
    screen.getByText('Modules & deck')
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
    expect(screen.queryByText('Mock ConfirmCancelRunModal')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'close' }))
    screen.getByText('Mock ConfirmCancelRunModal')
  })

  it('should launch protocol setup modules screen when click modules', () => {
    mockUseProtocolAnalysisAsDocumentQuery.mockReturnValue({
      data: mockRobotSideAnalysis,
    } as any)
    when(mockGetProtocolModulesInfo)
      .calledWith(mockRobotSideAnalysis, ot3StandardDeckDef as any)
      .mockReturnValue(mockProtocolModuleInfo)
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith([], mockProtocolModuleInfo)
      .mockReturnValue({ missingModuleIds: [], remainingAttachedModules: [] })
    render(`/runs/${RUN_ID}/setup/`)
    expect(screen.queryByText('Mock ProtocolSetupModulesAndDeck')).toBeNull()
    fireEvent.click(screen.getByText('Modules & deck'))
    screen.getByText('Mock ProtocolSetupModulesAndDeck')
  })

  it('should launch protocol setup liquids screen when click liquids', () => {
    mockUseProtocolAnalysisAsDocumentQuery.mockReturnValue({
      data: { ...mockRobotSideAnalysis, liquids: mockLiquids },
    } as any)
    when(mockGetProtocolModulesInfo)
      .calledWith(
        { ...mockRobotSideAnalysis, liquids: mockLiquids },
        ot3StandardDeckDef as any
      )
      .mockReturnValue(mockProtocolModuleInfo)
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith([], mockProtocolModuleInfo)
      .mockReturnValue({ missingModuleIds: [], remainingAttachedModules: [] })
    render(`/runs/${RUN_ID}/setup/`)
    expect(screen.queryByText('Mock ProtocolSetupLiquids')).toBeNull()
    screen.getByText('1 initial liquid')
    fireEvent.click(screen.getByText('Liquids'))
    screen.getByText('Mock ProtocolSetupLiquids')
  })

  it('should launch LPC when clicked', () => {
    mockUseLPCDisabledReason.mockReturnValue(null)
    render(`/runs/${RUN_ID}/setup/`)
    screen.getByText(/Recommended/)
    screen.getByText(/1 offset applied/)
    fireEvent.click(screen.getByText('Labware Position Check'))
    expect(mockLaunchLPC).toHaveBeenCalled()
    screen.getByText('mock LPC Wizard')
  })

  it('should render a confirmation modal when heater-shaker is in a protocol and it is not shaking', () => {
    mockUseIsHeaterShakerInProtocol.mockReturnValue(true)
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    screen.getByText('mock ConfirmAttachedModal')
  })
  it('should render a loading skeleton while awaiting a response from the server', () => {
    mockUseProtocolAnalysisAsDocumentQuery.mockReturnValue({
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
    mockUseDoorQuery.mockReturnValue({ data: mockOpenDoorStatus } as any)
    render(`/runs/${RUN_ID}/setup/`)
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    expect(MOCK_MAKE_SNACKBAR).toBeCalledWith(
      'Close the robot door before starting the run.'
    )
  })
})
