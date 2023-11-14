import * as React from 'react'
import { UseQueryResult } from 'react-query'
import { waitFor } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client'
import {
  getDeckDefFromRobotType,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'
import ot3StandardDeckDef from '@opentrons/shared-data/deck/definitions/4/ot3_standard.json'

import { i18n } from '../../../i18n'
import { useChainLiveCommands } from '../../../resources/runs/hooks'
import { mockRobotSideAnalysis } from '../../CommandText/__fixtures__'
import {
  useAttachedModules,
  useRunCalibrationStatus,
} from '../../Devices/hooks'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getProtocolModulesInfo } from '../../Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { mockApiHeaterShaker } from '../../../redux/modules/__fixtures__'
import { mockProtocolModuleInfo } from '../../ProtocolSetupInstruments/__fixtures__'
import { getLocalRobot } from '../../../redux/discovery'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import {
  getAttachedProtocolModuleMatches,
  getUnmatchedModulesForProtocol,
} from '../utils'
import { LocationConflictModal } from '../../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal'
import { ModuleWizardFlows } from '../../ModuleWizardFlows'
import { SetupInstructionsModal } from '../SetupInstructionsModal'
import { FixtureTable } from '../FixtureTable'
import { ModulesAndDeckMapViewModal } from '../ModulesAndDeckMapViewModal'
import { ProtocolSetupModulesAndDeck } from '..'

import type { CutoutConfig, DeckConfiguration } from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../resources/runs/hooks')
jest.mock('@opentrons/shared-data/js/helpers')
jest.mock('../../../redux/discovery')
jest.mock('../../../organisms/Devices/hooks')
jest.mock(
  '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
jest.mock('../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo')
jest.mock('../utils')
jest.mock('../SetupInstructionsModal')
jest.mock('../../ModuleWizardFlows')
jest.mock('../FixtureTable')
jest.mock('../../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal')
jest.mock('../ModulesAndDeckMapViewModal')

const mockGetDeckDefFromRobotType = getDeckDefFromRobotType as jest.MockedFunction<
  typeof getDeckDefFromRobotType
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockGetProtocolModulesInfo = getProtocolModulesInfo as jest.MockedFunction<
  typeof getProtocolModulesInfo
>
const mockGetAttachedProtocolModuleMatches = getAttachedProtocolModuleMatches as jest.MockedFunction<
  typeof getAttachedProtocolModuleMatches
>
const mockGetUnmatchedModulesForProtocol = getUnmatchedModulesForProtocol as jest.MockedFunction<
  typeof getUnmatchedModulesForProtocol
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockSetupInstructionsModal = SetupInstructionsModal as jest.MockedFunction<
  typeof SetupInstructionsModal
>
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>
const mockUseRunCalibrationStatus = useRunCalibrationStatus as jest.MockedFunction<
  typeof useRunCalibrationStatus
>
const mockModuleWizardFlows = ModuleWizardFlows as jest.MockedFunction<
  typeof ModuleWizardFlows
>
const mockUseChainLiveCommands = useChainLiveCommands as jest.MockedFunction<
  typeof useChainLiveCommands
>
const mockFixtureTable = FixtureTable as jest.MockedFunction<
  typeof FixtureTable
>
const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>
const mockLocationConflictModal = LocationConflictModal as jest.MockedFunction<
  typeof LocationConflictModal
>
const mockModulesAndDeckMapViewModal = ModulesAndDeckMapViewModal as jest.MockedFunction<
  typeof ModulesAndDeckMapViewModal
>

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const mockSetSetupScreen = jest.fn()
const mockSetCutoutId = jest.fn()
const mockSetProvidedFixtureOptions = jest.fn()

const calibratedMockApiHeaterShaker = {
  ...mockApiHeaterShaker,
  moduleOffset: {
    offset: {
      x: 0.1640625,
      y: -1.2421875,
      z: -1.759999999999991,
    },
    slot: '7',
    last_modified: '2023-06-01T14:42:20.131798+00:00',
  },
}
const mockFixture: CutoutConfig = {
  cutoutId: 'cutoutD3',
  cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
}

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ProtocolSetupModulesAndDeck
        runId={RUN_ID}
        setSetupScreen={mockSetSetupScreen}
        setCutoutId={mockSetCutoutId}
        setProvidedFixtureOptions={mockSetProvidedFixtureOptions}
      />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ProtocolSetupModulesAndDeck', () => {
  let mockChainLiveCommands = jest.fn()

  beforeEach(() => {
    mockChainLiveCommands = jest.fn()
    mockChainLiveCommands.mockResolvedValue(null)
    when(mockUseAttachedModules).calledWith().mockReturnValue([])
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(mockRobotSideAnalysis)
    when(mockGetProtocolModulesInfo)
      .calledWith(mockRobotSideAnalysis, ot3StandardDeckDef as any)
      .mockReturnValue([])
    when(mockGetAttachedProtocolModuleMatches)
      .calledWith([], [])
      .mockReturnValue([])
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith([], [])
      .mockReturnValue({ missingModuleIds: [], remainingAttachedModules: [] })
    when(mockGetDeckDefFromRobotType)
      .calledWith('OT-3 Standard')
      .mockReturnValue(ot3StandardDeckDef as any)
    mockSetupInstructionsModal.mockReturnValue(
      <div>mock SetupInstructionsModal</div>
    )
    mockGetLocalRobot.mockReturnValue({
      ...mockConnectedRobot,
      name: ROBOT_NAME,
    })
    mockLocationConflictModal.mockReturnValue(
      <div>mock location conflict modal</div>
    )
    mockUseDeckConfigurationQuery.mockReturnValue(({
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        complete: true,
      })
    mockModuleWizardFlows.mockReturnValue(<div>mock ModuleWizardFlows</div>)
    mockUseChainLiveCommands.mockReturnValue({
      chainLiveCommands: mockChainLiveCommands,
    } as any)
    mockFixtureTable.mockReturnValue(<div>mock FixtureTable</div>)
    mockModulesAndDeckMapViewModal.mockReturnValue(
      <div>mock ModulesAndDeckMapViewModal</div>
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render text and buttons', () => {
    const [{ getByRole, getByText }] = render()
    getByText('Module')
    getByText('Location')
    getByText('Status')
    getByText('Setup Instructions')
    getByRole('button', { name: 'Map View' })
  })

  it('should launch deck map on button click', () => {
    const [{ getByRole }] = render()

    getByRole('button', { name: 'Map View' }).click()
  })

  it('should launch setup instructions modal on button click', () => {
    const [{ getByText }] = render()

    getByText('Setup Instructions').click()
    getByText('mock SetupInstructionsModal')
  })

  it('should render module information when a protocol has module - connected', () => {
    // TODO: connected not location conflict
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith(calibratedMockApiHeaterShaker as any, mockProtocolModuleInfo)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: mockApiHeaterShaker as any,
      })
    mockGetAttachedProtocolModuleMatches.mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
        attachedModuleMatch: calibratedMockApiHeaterShaker,
      },
    ])
    const [{ getByText }] = render()
    getByText('Heater-Shaker Module GEN1')
    getByText('Connected')
  })

  it('should render module information when a protocol has module - disconnected', () => {
    // TODO: disconnected not location conflict
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith(mockApiHeaterShaker as any, mockProtocolModuleInfo)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: mockApiHeaterShaker as any,
      })
    mockGetAttachedProtocolModuleMatches.mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
      },
    ])
    const [{ getByText }] = render()
    getByText('Heater-Shaker Module GEN1')
    getByText('Disconnected')
  })

  it('should render module information with calibrate button when a protocol has module', async () => {
    // TODO: not location conflict
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith(mockApiHeaterShaker as any, mockProtocolModuleInfo)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: mockApiHeaterShaker as any,
      })
    mockGetAttachedProtocolModuleMatches.mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
        attachedModuleMatch: mockApiHeaterShaker,
      },
    ])
    const [{ getByText }] = render()
    getByText('Heater-Shaker Module GEN1')
    getByText('Calibrate').click()
    await waitFor(() => {
      expect(mockChainLiveCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'heaterShaker/closeLabwareLatch',
            params: {
              moduleId: mockApiHeaterShaker.id,
            },
          },
          {
            commandType: 'heaterShaker/deactivateHeater',
            params: {
              moduleId: mockApiHeaterShaker.id,
            },
          },
          {
            commandType: 'heaterShaker/deactivateShaker',
            params: {
              moduleId: mockApiHeaterShaker.id,
            },
          },
          {
            commandType: 'heaterShaker/openLabwareLatch',
            params: {
              moduleId: mockApiHeaterShaker.id,
            },
          },
        ],
        false
      )
    })
    getByText('mock ModuleWizardFlows')
  })

  it('should render module information with text button when a protocol has module - attach pipette first', () => {
    const ATTACH_FIRST = {
      complete: false,
      reason: 'attach_pipette_failure_reason',
    }
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue(ATTACH_FIRST as any)
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith(mockApiHeaterShaker as any, mockProtocolModuleInfo)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: mockApiHeaterShaker as any,
      })
    mockGetAttachedProtocolModuleMatches.mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
        attachedModuleMatch: mockApiHeaterShaker,
      },
    ])
    const [{ getByText }] = render()
    getByText('Heater-Shaker Module GEN1')
    getByText('Calibration required Attach pipette first')
  })

  it('should render module information with text button when a protocol has module - calibrate pipette first', () => {
    const CALIBRATE_FIRST = {
      complete: false,
      reason: 'calibrate_pipette_failure_reason',
    }
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue(CALIBRATE_FIRST as any)
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith(mockApiHeaterShaker as any, mockProtocolModuleInfo)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: mockApiHeaterShaker as any,
      })
    mockGetAttachedProtocolModuleMatches.mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
        attachedModuleMatch: mockApiHeaterShaker,
      },
    ])
    const [{ getByText }] = render()
    getByText('Heater-Shaker Module GEN1')
    getByText('Calibration required Calibrate pipette first')
  })

  it('should render mock Fixture table and module location conflict', () => {
    mockUseDeckConfigurationQuery.mockReturnValue({
      data: [mockFixture],
    } as UseQueryResult<DeckConfiguration>)
    mockGetAttachedProtocolModuleMatches.mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
        attachedModuleMatch: calibratedMockApiHeaterShaker,
        slotName: 'D3',
      },
    ])
    const [{ getByText }] = render()
    getByText('mock FixtureTable')
    getByText('Location conflict').click()
    getByText('mock location conflict modal')
  })

  it('should render ModulesAndDeckMapViewModal when tapping map view button', () => {
    const [{ getByText }] = render()
    getByText('Map View').click()
    getByText('mock ModulesAndDeckMapViewModal')
  })
})
