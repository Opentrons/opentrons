import * as React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { MemoryRouter } from 'react-router-dom'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  FLEX_ROBOT_TYPE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { useChainLiveCommands } from '../../../resources/runs'
import { mockRobotSideAnalysis } from '../../../molecules/Command/__fixtures__'
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
import { useNotifyDeckConfigurationQuery } from '../../../resources/deck_configuration'
import { useRunStatus } from '../../RunTimeControl/hooks'

import type { CutoutConfig, DeckConfiguration } from '@opentrons/shared-data'
import type { UseQueryResult } from 'react-query'

vi.mock('../../../resources/runs')
vi.mock('../../../redux/discovery')
vi.mock('../../../organisms/Devices/hooks')
vi.mock('../../../resources/deck_configuration')
vi.mock(
  '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
vi.mock('../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo')
vi.mock('../utils')
vi.mock('../SetupInstructionsModal')
vi.mock('../../ModuleWizardFlows')
vi.mock('../FixtureTable')
vi.mock('../../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal')
vi.mock('../ModulesAndDeckMapViewModal')
vi.mock('../../RunTimeControl/hooks')

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const mockSetSetupScreen = vi.fn()
const mockSetCutoutId = vi.fn()
const mockSetProvidedFixtureOptions = vi.fn()

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
const flexDeckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
describe('ProtocolSetupModulesAndDeck', () => {
  let mockChainLiveCommands = vi.fn()

  beforeEach(() => {
    mockChainLiveCommands = vi.fn()
    mockChainLiveCommands.mockResolvedValue(null)
    when(vi.mocked(useAttachedModules)).calledWith().thenReturn([])
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(mockRobotSideAnalysis)
    when(vi.mocked(getProtocolModulesInfo))
      .calledWith(mockRobotSideAnalysis, flexDeckDef)
      .thenReturn([])
    when(vi.mocked(getAttachedProtocolModuleMatches))
      .calledWith([], [], [])
      .thenReturn([])
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith([], [])
      .thenReturn({ missingModuleIds: [], remainingAttachedModules: [] })
    vi.mocked(getLocalRobot).mockReturnValue({
      ...mockConnectedRobot,
      name: ROBOT_NAME,
    })
    vi.mocked(LocationConflictModal).mockReturnValue(
      <div>mock location conflict modal</div>
    )
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue(({
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)
    when(vi.mocked(useRunCalibrationStatus))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({
        complete: true,
      })
    vi.mocked(ModuleWizardFlows).mockReturnValue(
      <div>mock ModuleWizardFlows</div>
    )
    vi.mocked(useChainLiveCommands).mockReturnValue({
      chainLiveCommands: mockChainLiveCommands,
    } as any)
    vi.mocked(FixtureTable).mockReturnValue(<div>mock FixtureTable</div>)
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_IDLE)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render text and buttons', () => {
    vi.mocked(getAttachedProtocolModuleMatches).mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
        attachedModuleMatch: calibratedMockApiHeaterShaker,
      },
    ])
    render()
    screen.getByText('Deck hardware')
    screen.getByText('Location')
    screen.getByText('Status')
    screen.getByText('Setup Instructions')
    screen.getByRole('button', { name: 'Map View' })
  })

  it('should launch deck map on button click', () => {
    render()

    fireEvent.click(screen.getByRole('button', { name: 'Map View' }))
  })

  it('should launch setup instructions modal on button click', () => {
    render()

    fireEvent.click(screen.getByText('Setup Instructions'))
    expect(vi.mocked(SetupInstructionsModal)).toHaveBeenCalled()
  })

  it('should render module information when a protocol has module - connected', () => {
    // TODO: connected not location conflict
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith(calibratedMockApiHeaterShaker as any, mockProtocolModuleInfo)
      .thenReturn({
        missingModuleIds: [],
        remainingAttachedModules: mockApiHeaterShaker as any,
      })
    vi.mocked(getAttachedProtocolModuleMatches).mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
        attachedModuleMatch: calibratedMockApiHeaterShaker,
      },
    ])
    render()
    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Connected')
  })

  it('should render module information when a protocol has module - disconnected', () => {
    // TODO: disconnected not location conflict
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith(mockApiHeaterShaker as any, mockProtocolModuleInfo)
      .thenReturn({
        missingModuleIds: [],
        remainingAttachedModules: mockApiHeaterShaker as any,
      })
    vi.mocked(getAttachedProtocolModuleMatches).mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
      },
    ])
    render()
    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Disconnected')
  })

  it('should render module information with calibrate button when a protocol has module', async () => {
    // TODO: not location conflict
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith(mockApiHeaterShaker as any, mockProtocolModuleInfo)
      .thenReturn({
        missingModuleIds: [],
        remainingAttachedModules: mockApiHeaterShaker as any,
      })
    vi.mocked(getAttachedProtocolModuleMatches).mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
        attachedModuleMatch: mockApiHeaterShaker,
      },
    ])
    render()
    screen.getByText('Heater-Shaker Module GEN1')
    fireEvent.click(screen.getByText('Calibrate'))
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
    screen.getByText('mock ModuleWizardFlows')
  })

  it('should render module information with text button when a protocol has module - attach pipette first', () => {
    const ATTACH_FIRST = {
      complete: false,
      reason: 'attach_pipette_failure_reason',
    }
    when(vi.mocked(useRunCalibrationStatus))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn(ATTACH_FIRST as any)
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith(mockApiHeaterShaker as any, mockProtocolModuleInfo)
      .thenReturn({
        missingModuleIds: [],
        remainingAttachedModules: mockApiHeaterShaker as any,
      })
    vi.mocked(getAttachedProtocolModuleMatches).mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
        attachedModuleMatch: mockApiHeaterShaker,
      },
    ])
    render()
    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Calibration required Attach pipette first')
  })

  it('should render module information with text button when a protocol has module - calibrate pipette first', () => {
    const CALIBRATE_FIRST = {
      complete: false,
      reason: 'calibrate_pipette_failure_reason',
    }
    when(vi.mocked(useRunCalibrationStatus))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn(CALIBRATE_FIRST as any)
    when(vi.mocked(getUnmatchedModulesForProtocol))
      .calledWith(mockApiHeaterShaker as any, mockProtocolModuleInfo)
      .thenReturn({
        missingModuleIds: [],
        remainingAttachedModules: mockApiHeaterShaker as any,
      })
    vi.mocked(getAttachedProtocolModuleMatches).mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
        attachedModuleMatch: mockApiHeaterShaker,
      },
    ])
    render()
    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Calibration required Calibrate pipette first')
  })

  it('should render mock Fixture table and module location conflict', () => {
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [mockFixture],
    } as UseQueryResult<DeckConfiguration>)
    vi.mocked(getAttachedProtocolModuleMatches).mockReturnValue([
      {
        ...mockProtocolModuleInfo[0],
        attachedModuleMatch: undefined,
        slotName: 'D3',
      },
    ])
    render()
    screen.getByText('mock FixtureTable')
    fireEvent.click(screen.getByText('Resolve'))
    screen.getByText('mock location conflict modal')
  })

  it('should render ModulesAndDeckMapViewModal when tapping map view button', () => {
    render()
    fireEvent.click(screen.getByText('Map View'))
    screen.debug()
    expect(vi.mocked(ModulesAndDeckMapViewModal)).toHaveBeenCalled()
  })
})
