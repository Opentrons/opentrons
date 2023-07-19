import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { COLORS, renderWithProviders } from '@opentrons/components'
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
import { MultipleModulesModal } from '../MultipleModulesModal'
import { UnMatchedModuleWarning } from '../UnMatchedModuleWarning'
import {
  useIsOT3,
  useModuleRenderInfoForProtocolById,
  useRunHasStarted,
  useUnmatchedModulesForProtocol,
} from '../../../hooks'
import { HeaterShakerWizard } from '../../../HeaterShakerWizard'
import { SetupModulesList } from '../SetupModulesList'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'

jest.mock('../../../hooks')
jest.mock('../UnMatchedModuleWarning')
jest.mock('../../../HeaterShakerWizard')
jest.mock('../MultipleModulesModal')
const mockUseIsOt3 = useIsOT3 as jest.MockedFunction<typeof useIsOT3>
const mockUseModuleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById as jest.MockedFunction<
  typeof useModuleRenderInfoForProtocolById
>
const mockUnMatchedModuleWarning = UnMatchedModuleWarning as jest.MockedFunction<
  typeof UnMatchedModuleWarning
>
const mockHeaterShakerWizard = HeaterShakerWizard as jest.MockedFunction<
  typeof HeaterShakerWizard
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

const render = (props: React.ComponentProps<typeof SetupModulesList>) => {
  return renderWithProviders(<SetupModulesList {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SetupModulesList', () => {
  let props: React.ComponentProps<typeof SetupModulesList>
  beforeEach(() => {
    props = {
      robotName: ROBOT_NAME,
      runId: RUN_ID,
    }
    when(mockHeaterShakerWizard).mockReturnValue(
      <div>mockHeaterShakerWizard</div>
    )
    when(mockUnMatchedModuleWarning).mockReturnValue(
      <div>mock unmatched module Banner</div>
    )
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })
  })
  afterEach(() => resetAllWhenMocks())

  it('should render the list view headers', () => {
    when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(false)
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({})
    const { getByText } = render(props)
    getByText('Module Name')
    getByText('Location')
    getByText('Connection Status')
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
        attachedModuleMatch: mockMagneticModuleGen2,
      },
    } as any)

    const { getByText, getByTestId } = render(props)
    getByText('Magnetic Module')
    getByText('Slot 1')
    getByText('Connected')
    expect(getByTestId('status_label_Connected_1')).toHaveStyle({
      backgroundColor: COLORS.successBackgroundLight,
    })
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

    const { getByText, getByTestId } = render(props)
    getByText('Magnetic Module')
    getByText('Slot 1')
    getByText('Not connected')
    expect(getByTestId('status_label_Not connected_1')).toHaveStyle({
      backgroundColor: COLORS.warningBackgroundLight,
    })
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
        attachedModuleMatch: mockThermocycler,
      },
    } as any)
    mockUseIsOt3.mockReturnValue(false)

    const { getByText } = render(props)
    getByText('Thermocycler Module')
    getByText('Slot 7,8,10,11')
    getByText('Connected')
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
        attachedModuleMatch: mockThermocycler,
      },
    } as any)
    mockUseIsOt3.mockReturnValue(true)

    const { getByText } = render(props)
    getByText('Thermocycler Module')
    getByText('Slot A1+B1')
    getByText('Connected')
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
      .calledWith(ROBOT_NAME, RUN_ID)
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
        },
      })
    const { getByText, getByTestId } = render(props)
    const help = getByTestId('Banner_close-button')
    fireEvent.click(help)
    getByText('mock Moam modal')
  })
  it('should render the module unmatching banner', () => {
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: ['moduleId'],
        remainingAttachedModules: [mockHeaterShaker],
      })
    const { getByText } = render(props)
    getByText('mock unmatched module Banner')
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
    const { getByText } = render(props)
    const moduleSetup = getByText('View module setup instructions')
    fireEvent.click(moduleSetup)
    getByText('mockHeaterShakerWizard')
  })
  it('shoulde render a magnetic block', () => {
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
        slotName: '1',
        attachedModuleMatch: null,
      },
    } as any)
    const { getByText } = render(props)
    getByText('No USB connection required')
    getByText('N/A')
    getByText('Magnetic Block GEN1')
  })
})
