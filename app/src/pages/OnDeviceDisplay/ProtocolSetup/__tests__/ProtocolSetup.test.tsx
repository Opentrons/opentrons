import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
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
} from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  STAGING_AREA_LOAD_NAME,
} from '@opentrons/shared-data'
import ot3StandardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot3_standard.json'

import { i18n } from '../../../../i18n'
import { useToaster } from '../../../../organisms/ToasterOven'
import { mockRobotSideAnalysis } from '../../../../organisms/CommandText/__fixtures__'
import {
  useAttachedModules,
  useLPCDisabledReason,
  useRunCreatedAtTimestamp,
  useModuleCalibrationStatus,
  useRobotType,
} from '../../../../organisms/Devices/hooks'
import { getLocalRobot } from '../../../../redux/discovery'
import { useMostRecentCompletedAnalysis } from '../../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ProtocolSetupLiquids } from '../../../../organisms/ProtocolSetupLiquids'
import { getProtocolModulesInfo } from '../../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { ProtocolSetupModulesAndDeck } from '../../../../organisms/ProtocolSetupModulesAndDeck'
import { getUnmatchedModulesForProtocol } from '../../../../organisms/ProtocolSetupModulesAndDeck/utils'
import { useLaunchLPC } from '../../../../organisms/LabwarePositionCheck/useLaunchLPC'
import { ConfirmCancelRunModal } from '../../../../organisms/OnDeviceDisplay/RunningProtocol'
import { mockProtocolModuleInfo } from '../../../../organisms/ProtocolSetupInstruments/__fixtures__'
import {
  useRunControls,
  useRunStatus,
} from '../../../../organisms/RunTimeControl/hooks'
import { useIsHeaterShakerInProtocol } from '../../../../organisms/ModuleCard/hooks'
import { ConfirmAttachedModal } from '../ConfirmAttachedModal'
import { ProtocolSetup } from '..'

import type { UseQueryResult } from 'react-query'
import type {
  DeckConfiguration,
  CompletedProtocolAnalysis,
  Fixture,
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
jest.mock('../../../../organisms/LabwarePositionCheck/useLaunchLPC')
jest.mock('../../../../organisms/Devices/hooks')
jest.mock(
  '../../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
jest.mock(
  '../../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
)
jest.mock('../../../../organisms/ProtocolSetupModulesAndDeck')
jest.mock('../../../../organisms/ProtocolSetupModulesAndDeck/utils')
jest.mock('../../../../organisms/OnDeviceDisplay/RunningProtocol')
jest.mock('../../../../organisms/RunTimeControl/hooks')
jest.mock('../../../../organisms/ProtocolSetupLiquids')
jest.mock('../../../../organisms/ModuleCard/hooks')
jest.mock('../../../../redux/discovery/selectors')
jest.mock('../ConfirmAttachedModal')
jest.mock('../../../../organisms/ToasterOven')

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
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
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
  fixtureId: 'mockId',
  fixtureLocation: 'cutoutD1',
  loadName: STAGING_AREA_LOAD_NAME,
} as Fixture

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
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(mockEmptyAnalysis)
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
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render text, image, and buttons', () => {
    const [{ getByText }] = render(`/runs/${RUN_ID}/setup/`)
    getByText('Prepare to run')
    getByText('Instruments')
    getByText('Modules & deck')
    getByText('Labware')
    getByText('Labware Position Check')
    getByText('Liquids')
  })

  it('should play protocol when click play button', () => {
    const [{ getByRole }] = render(`/runs/${RUN_ID}/setup/`)
    expect(mockPlay).toBeCalledTimes(0)
    getByRole('button', { name: 'play' }).click()
    expect(mockPlay).toBeCalledTimes(1)
  })

  it('should launch cancel modal when click close button', () => {
    const [{ getByRole, getByText, queryByText }] = render(
      `/runs/${RUN_ID}/setup/`
    )
    expect(queryByText('Mock ConfirmCancelRunModal')).toBeNull()
    getByRole('button', { name: 'close' }).click()
    getByText('Mock ConfirmCancelRunModal')
  })

  it('should launch protocol setup modules screen when click modules', () => {
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(mockRobotSideAnalysis)
    when(mockGetProtocolModulesInfo)
      .calledWith(mockRobotSideAnalysis, ot3StandardDeckDef as any)
      .mockReturnValue(mockProtocolModuleInfo)
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith([], mockProtocolModuleInfo)
      .mockReturnValue({ missingModuleIds: [], remainingAttachedModules: [] })
    const [{ getByText, queryByText }] = render(`/runs/${RUN_ID}/setup/`)
    expect(queryByText('Mock ProtocolSetupModulesAndDeck')).toBeNull()
    queryByText('Modules & deck')?.click()
    getByText('Mock ProtocolSetupModulesAndDeck')
  })

  it('should launch protocol setup liquids screen when click liquids', () => {
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue({ ...mockRobotSideAnalysis, liquids: mockLiquids })
    when(mockGetProtocolModulesInfo)
      .calledWith(
        { ...mockRobotSideAnalysis, liquids: mockLiquids },
        ot3StandardDeckDef as any
      )
      .mockReturnValue(mockProtocolModuleInfo)
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith([], mockProtocolModuleInfo)
      .mockReturnValue({ missingModuleIds: [], remainingAttachedModules: [] })
    const [{ getByText, queryByText }] = render(`/runs/${RUN_ID}/setup/`)
    expect(queryByText('Mock ProtocolSetupLiquids')).toBeNull()
    getByText('1 initial liquid')
    getByText('Liquids').click()
    getByText('Mock ProtocolSetupLiquids')
  })

  it('should launch LPC when clicked', () => {
    mockUseLPCDisabledReason.mockReturnValue(null)
    const [{ getByText }] = render(`/runs/${RUN_ID}/setup/`)
    getByText(/Recommended/)
    getByText(/1 offset applied/)
    getByText('Labware Position Check').click()
    expect(mockLaunchLPC).toHaveBeenCalled()
    getByText('mock LPC Wizard')
  })

  it('should render a confirmation modal when heater-shaker is in a protocol and it is not shaking', () => {
    mockUseIsHeaterShakerInProtocol.mockReturnValue(true)
    const [{ getByRole, getByText }] = render(`/runs/${RUN_ID}/setup/`)
    getByRole('button', { name: 'play' }).click()
    getByText('mock ConfirmAttachedModal')
  })
  it('should render a loading skeleton while awaiting a response from the server', () => {
    mockUseMostRecentCompletedAnalysis.mockReturnValue(null)
    const [{ getAllByTestId }] = render(`/runs/${RUN_ID}/setup/`)
    expect(getAllByTestId('Skeleton').length).toBeGreaterThan(0)
  })

  it('should render toast and make a button disabled when a robot door is open', () => {
    const mockOpenDoorStatus = {
      data: {
        status: 'open',
        doorRequiredClosedForProtocol: true,
      },
    }
    mockUseDoorQuery.mockReturnValue({ data: mockOpenDoorStatus } as any)
    const [{ getByRole }] = render(`/runs/${RUN_ID}/setup/`)
    getByRole('button', { name: 'play' }).click()
    expect(MOCK_MAKE_SNACKBAR).toBeCalledWith(
      'Close the robot door before starting the run.'
    )
  })
})
