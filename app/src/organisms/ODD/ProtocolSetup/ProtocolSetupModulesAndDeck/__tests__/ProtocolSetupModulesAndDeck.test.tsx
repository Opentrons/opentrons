import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockRobotSideAnalysis } from '/app/molecules/Command/__fixtures__'
import { useIsDoorOpen } from '/app/organisms/DoorOpenControl/useIsDoorOpen'
import { LocationConflictModal } from '/app/organisms/LocationConflictModal'
import { handleModuleWizardFlows } from '/app/organisms/ModuleWizardFlows'
import { getLocalRobot } from '/app/redux/discovery'
import { mockConnectedRobot } from '/app/redux/discovery/__fixtures__'
import { mockApiHeaterShaker } from '/app/redux/modules/__fixtures__'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useAttachedModules } from '/app/resources/modules'
import {
  useChainLiveCommands,
  useMostRecentCompletedAnalysis,
  useNotifyRunQuery,
  useRunCalibrationStatus,
} from '/app/resources/runs'
import {
  getAttachedProtocolModuleMatches,
  getProtocolModulesInfo,
} from '/app/transformations/analysis'

import { ProtocolSetupModulesAndDeck } from '..'
import { mockProtocolModuleInfo } from '../../ProtocolSetupInstruments/__fixtures__'
import { FixtureTable } from '../FixtureTable'
import { ModulesAndDeckMapView } from '../ModulesAndDeckMapView'
import { SetupInstructionsModal } from '../SetupInstructionsModal'
import { getUnmatchedModulesForProtocol } from '../utils'

import type { UseQueryResult } from 'react-query'
import type { CutoutConfig, DeckConfiguration } from '@opentrons/shared-data'
import type * as ProtocolSetupUtils from '../utils'

vi.mock('/app/resources/runs')
vi.mock('/app/resources/modules')
vi.mock('/app/redux/discovery')
vi.mock('/app/resources/deck_configuration')
vi.mock('/app/transformations/analysis')
// Only mock getUnmatchedModulesForProtocol so ModuleTableItem's getDoesModuleRequireCalibration stays real
vi.mock('../utils', async importOriginal => {
  const actual = await importOriginal<typeof ProtocolSetupUtils>()
  return {
    ...actual,
    getUnmatchedModulesForProtocol: vi.fn(),
  }
})
vi.mock('../SetupInstructionsModal')
vi.mock('/app/organisms/ModuleWizardFlows')
vi.mock('/app/organisms/DoorOpenControl/useIsDoorOpen')
vi.mock('../FixtureTable')
vi.mock('/app/organisms/LocationConflictModal')
vi.mock('../ModulesAndDeckMapView')

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const mockSetSetupScreen = vi.fn()

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
    vi.mocked(useIsDoorOpen).mockReturnValue({
      isDoorOpen: true,
      moduleDoorLocation: null,
    })
    vi.mocked(LocationConflictModal).mockReturnValue(
      <div>mock location conflict modal</div>
    )
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [],
    } as unknown as UseQueryResult<DeckConfiguration>)
    when(vi.mocked(useRunCalibrationStatus))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({
        complete: true,
      })
    vi.mocked(useChainLiveCommands).mockReturnValue({
      chainLiveCommands: mockChainLiveCommands,
    } as any)
    vi.mocked(FixtureTable).mockReturnValue(<div>mock FixtureTable</div>)
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: { data: { status: RUN_STATUS_IDLE } },
    } as any)
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
    screen.getByRole('button', { name: 'Display Map View' })
  })

  it('should launch deck map on button click', () => {
    render()

    fireEvent.click(screen.getByRole('button', { name: 'Display Map View' }))
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
    expect(vi.mocked(handleModuleWizardFlows)).toHaveBeenCalled()
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

  it('should render ModulesAndDeckMapView when tapping map view button', () => {
    render()
    fireEvent.click(screen.getByText('Map View'))
    expect(vi.mocked(ModulesAndDeckMapView)).toHaveBeenCalled()
  })
})
