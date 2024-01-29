import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { STAGING_AREA_RIGHT_SLOT_FIXTURE } from '@opentrons/shared-data'
import { i18n } from '../../../../../i18n'
import {
  mockMagneticModule as mockMagneticModuleFixture,
  mockHeaterShaker,
  mockMagneticBlock,
} from '../../../../../redux/modules/__fixtures__/index'
import {
  mockMagneticModuleGen2,
  mockThermocycler,
} from '../../../../../redux/modules/__fixtures__'
import { useChainLiveCommands } from '../../../../../resources/runs/hooks'
import { ModuleSetupModal } from '../../../../ModuleCard/ModuleSetupModal'
import { ModuleWizardFlows } from '../../../../ModuleWizardFlows'
import {
  useIsFlex,
  useModuleRenderInfoForProtocolById,
  useRunHasStarted,
  useUnmatchedModulesForProtocol,
  useRunCalibrationStatus,
} from '../../../hooks'
import { MultipleModulesModal } from '../MultipleModulesModal'
import { UnMatchedModuleWarning } from '../UnMatchedModuleWarning'
import { SetupModulesList } from '../SetupModulesList'
import { LocationConflictModal } from '../LocationConflictModal'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../hooks')
jest.mock('../LocationConflictModal')
jest.mock('../UnMatchedModuleWarning')
jest.mock('../../../../ModuleCard/ModuleSetupModal')
jest.mock('../../../../ModuleWizardFlows')
jest.mock('../MultipleModulesModal')
jest.mock('../../../../../resources/runs/hooks')
jest.mock('../../../../../redux/config')

const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>
const mockUseModuleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById as jest.MockedFunction<
  typeof useModuleRenderInfoForProtocolById
>
const mockUnMatchedModuleWarning = UnMatchedModuleWarning as jest.MockedFunction<
  typeof UnMatchedModuleWarning
>
const mockModuleSetupModal = ModuleSetupModal as jest.MockedFunction<
  typeof ModuleSetupModal
>
const mockUseUnmatchedModulesForProtocol = useUnmatchedModulesForProtocol as jest.MockedFunction<
  typeof useUnmatchedModulesForProtocol
>
const mockUseRunHasStarted = useRunHasStarted as jest.MockedFunction<
  typeof useRunHasStarted
>
const mockMultipleModulesModal = MultipleModulesModal as jest.MockedFunction<
  typeof MultipleModulesModal
>
const mockModuleWizardFlows = ModuleWizardFlows as jest.MockedFunction<
  typeof ModuleWizardFlows
>
const mockUseRunCalibrationStatus = useRunCalibrationStatus as jest.MockedFunction<
  typeof useRunCalibrationStatus
>
const mockUseChainLiveCommands = useChainLiveCommands as jest.MockedFunction<
  typeof useChainLiveCommands
>
const mockLocationConflictModal = LocationConflictModal as jest.MockedFunction<
  typeof LocationConflictModal
>

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]
const MOCK_TC_COORDS = [20, 30, 0]
const MOCK_SECOND_MAGNETIC_MODULE_COORDS = [100, 200, 0]

const mockMagneticModule = {
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  calibrationPoint: { x: 0, y: 0 },
  displayName: 'Magnetic Module',
  dimensions: {},
  twoDimensionalRendering: { children: [] },
  quirks: [],
}

const mockTCModule = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'TCModuleId',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleType,
  displayName: 'Thermocycler Module',
}

const mockCalibratedData = {
  offset: {
    x: 0.1640625,
    y: -1.2421875,
    z: -1.759999999999991,
  },
  slot: '7',
  last_modified: '2023-06-01T14:42:20.131798+00:00',
}

const render = (props: React.ComponentProps<typeof SetupModulesList>) => {
  return renderWithProviders(<SetupModulesList {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SetupModulesList', () => {
  let props: React.ComponentProps<typeof SetupModulesList>
  let mockChainLiveCommands = jest.fn()
  beforeEach(() => {
    props = {
      robotName: ROBOT_NAME,
      runId: RUN_ID,
    }
    mockChainLiveCommands = jest.fn()
    mockChainLiveCommands.mockResolvedValue(null)
    when(mockModuleSetupModal).mockReturnValue(<div>mockModuleSetupModal</div>)
    when(mockUnMatchedModuleWarning).mockReturnValue(
      <div>mock unmatched module Banner</div>
    )
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        complete: true,
      })
    mockModuleWizardFlows.mockReturnValue(<div>mock ModuleWizardFlows</div>)
    mockUseChainLiveCommands.mockReturnValue({
      chainLiveCommands: mockChainLiveCommands,
    } as any)
    mockLocationConflictModal.mockReturnValue(
      <div>mock location conflict modal</div>
    )
  })
  afterEach(() => resetAllWhenMocks())

  it('should render the list view headers', () => {
    when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(false)
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(RUN_ID)
      .mockReturnValue({})
    render(props)
    screen.getByText('Module')
    screen.getByText('Location')
    screen.getByText('Status')
  })

  it('should render a magnetic module that is connected', () => {
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
        slotName: '1',
        attachedModuleMatch: {
          ...mockMagneticModuleGen2,
          moduleOffset: mockCalibratedData,
        },
      },
    } as any)

    render(props)
    screen.getByText('Magnetic Module')
    screen.getByText('1')
    screen.getByText('Connected')
  })

  it('should render a magnetic module that is NOT connected', () => {
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
        slotName: '1',
        attachedModuleMatch: null,
      },
    } as any)

    render(props)
    screen.getByText('Magnetic Module')
    screen.getByText('1')
    screen.getByText('Not connected')
  })

  it('should render a thermocycler module that is connected, OT2', () => {
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })
    mockUseModuleRenderInfoForProtocolById.mockReturnValue({
      [mockTCModule.moduleId]: {
        moduleId: mockTCModule.moduleId,
        x: MOCK_TC_COORDS[0],
        y: MOCK_TC_COORDS[1],
        z: MOCK_TC_COORDS[2],
        moduleDef: mockTCModule as any,
        nestedLabwareDef: null,
        nestedLabwareId: null,
        protocolLoadOrder: 0,
        slotName: '7',
        attachedModuleMatch: {
          ...mockThermocycler,
          moduleOffset: mockCalibratedData,
        },
      },
    } as any)
    mockUseIsFlex.mockReturnValue(false)

    render(props)
    screen.getByText('Thermocycler Module')
    screen.getByText('7,8,10,11')
    screen.getByText('Connected')
  })

  it('should render a thermocycler module that is connected but not calibrated, OT3', async () => {
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })
    mockUseModuleRenderInfoForProtocolById.mockReturnValue({
      [mockTCModule.moduleId]: {
        moduleId: mockTCModule.moduleId,
        x: MOCK_TC_COORDS[0],
        y: MOCK_TC_COORDS[1],
        z: MOCK_TC_COORDS[2],
        moduleDef: mockTCModule as any,
        nestedLabwareDef: null,
        nestedLabwareId: null,
        protocolLoadOrder: 0,
        slotName: '7',
        attachedModuleMatch: mockThermocycler,
      },
    } as any)
    mockUseIsFlex.mockReturnValue(true)

    render(props)
    screen.getByText('Thermocycler Module')
    screen.getByText('A1+B1')
    fireEvent.click(screen.getByRole('button', { name: 'Calibrate now' }))
    await waitFor(() => {
      screen.getByText('mock ModuleWizardFlows')
    })
  })

  it('should render disabled button when pipette and module are not calibrated', () => {
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        complete: false,
        reason: 'calibrate_pipette_failure_reason',
      })
    mockUseModuleRenderInfoForProtocolById.mockReturnValue({
      [mockTCModule.moduleId]: {
        moduleId: mockTCModule.moduleId,
        x: MOCK_TC_COORDS[0],
        y: MOCK_TC_COORDS[1],
        z: MOCK_TC_COORDS[2],
        moduleDef: mockTCModule as any,
        nestedLabwareDef: null,
        nestedLabwareId: null,
        protocolLoadOrder: 0,
        slotName: '7',
        attachedModuleMatch: mockThermocycler,
      },
    } as any)
    mockUseIsFlex.mockReturnValue(true)

    render(props)
    expect(screen.getByRole('button', { name: 'Calibrate now' })).toBeDisabled()
  })

  it('should render a thermocycler module that is connected, OT3', () => {
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })
    mockUseModuleRenderInfoForProtocolById.mockReturnValue({
      [mockTCModule.moduleId]: {
        moduleId: mockTCModule.moduleId,
        x: MOCK_TC_COORDS[0],
        y: MOCK_TC_COORDS[1],
        z: MOCK_TC_COORDS[2],
        moduleDef: mockTCModule as any,
        nestedLabwareDef: null,
        nestedLabwareId: null,
        protocolLoadOrder: 0,
        slotName: '7',
        attachedModuleMatch: {
          ...mockThermocycler,
          moduleOffset: mockCalibratedData,
        },
      },
    } as any)
    mockUseIsFlex.mockReturnValue(true)

    render(props)
    screen.getByText('Thermocycler Module')
    screen.getByText('A1+B1')
    screen.getByText('Connected')
  })

  it('should render the MoaM component when Moam is attached', () => {
    when(mockMultipleModulesModal).mockReturnValue(<div>mock Moam modal</div>)
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })
    const dupModId = `${mockMagneticModule.moduleId}duplicate`
    const dupModPort = 10
    const dupModHub = 2
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          moduleId: mockMagneticModule.moduleId,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: {
            ...mockMagneticModuleFixture,
            model: mockMagneticModule.model,
          } as any,
          slotName: '1',
          conflictedFixture: null,
        },
        [dupModId]: {
          moduleId: dupModId,
          x: MOCK_SECOND_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_SECOND_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_SECOND_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: {
            ...mockMagneticModuleFixture,
            model: mockMagneticModule.model,
            usbPort: {
              port: dupModPort,
              hub: dupModHub,
            },
          } as any,
          slotName: '3',
          conflictedFixture: null,
        },
      })
    render(props)
    const help = screen.getByTestId('Banner_close-button')
    fireEvent.click(help)
    screen.getByText('mock Moam modal')
  })
  it('should render the module unmatching banner', () => {
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: ['moduleId'],
        remainingAttachedModules: [mockHeaterShaker],
      })
    render(props)
    screen.getByText('mock unmatched module Banner')
  })
  it('should render the heater shaker text when hs is attached', () => {
    mockUseModuleRenderInfoForProtocolById.mockReturnValue({
      [mockHeaterShaker.id]: {
        moduleId: mockHeaterShaker.id,
        x: MOCK_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_MAGNETIC_MODULE_COORDS[2],
        moduleDef: {
          id: 'heatershaker_id',
          model: 'heaterShakerModuleV1',
          moduleType: 'heaterShakerModuleType',
          serialNumber: 'jkl123',
          hardwareRevision: 'heatershaker_v4.0',
          firmwareVersion: 'v2.0.0',
          hasAvailableUpdate: true,
          data: {
            labwareLatchStatus: 'idle_unknown',
            speedStatus: 'idle',
            temperatureStatus: 'idle',
            currentSpeed: null,
            currentTemperature: null,
            targetSpeed: null,
            targetTemperature: null,
            errorDetails: null,
            status: 'idle',
          },
          usbPort: { path: '/dev/ot_module_heatershaker0', port: 1, hub: null },
        },
        nestedLabwareDef: null,
        nestedLabwareId: null,
        protocolLoadOrder: 0,
        slotName: '1',
        attachedModuleMatch: null,
      },
    } as any)
    render(props)
    const moduleSetup = screen.getByText('View setup instructions')
    fireEvent.click(moduleSetup)
    screen.getByText('mockModuleSetupModal')
  })
  it('should render a magnetic block with a conflicted fixture', () => {
    when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(true)
    mockUseModuleRenderInfoForProtocolById.mockReturnValue({
      [mockMagneticBlock.id]: {
        moduleId: mockMagneticBlock.id,
        x: MOCK_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_MAGNETIC_MODULE_COORDS[2],
        moduleDef: {
          id: 'magneticBlock_id',
          model: mockMagneticBlock.moduleModel,
          moduleType: mockMagneticBlock.moduleType,
          displayName: mockMagneticBlock.displayName,
        },
        nestedLabwareDef: null,
        nestedLabwareId: null,
        protocolLoadOrder: 0,
        slotName: 'B3',
        attachedModuleMatch: null,
        conflictedFixture: {
          cutoutId: 'cutoutB3',
          cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
        },
      },
    } as any)
    render(props)
    screen.getByText('No USB connection required')
    screen.getByText('Location conflict')
    screen.getByText('Magnetic Block GEN1')
    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }))
    screen.getByText('mock location conflict modal')
  })
})
