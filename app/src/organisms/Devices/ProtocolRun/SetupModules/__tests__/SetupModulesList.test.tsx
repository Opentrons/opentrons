import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { useModuleRenderInfoForProtocolById } from '../../../hooks'
import { SetupModulesList } from '../SetupModulesList'
import {
  mockMagneticModuleGen2,
  mockThermocycler,
} from '../../../../../redux/modules/__fixtures__'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'

jest.mock('../../../hooks')

const mockUseModuleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById as jest.MockedFunction<
  typeof useModuleRenderInfoForProtocolById
>

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]
const MOCK_TC_COORDS = [20, 30, 0]

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
  beforeEach(() => {})
  afterEach(() => resetAllWhenMocks())

  it('should render the list view headers', () => {
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

  it('should render a thermocycler module that is connected', () => {
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

    const { getByText } = render(props)
    getByText('Thermocycler Module')
    getByText('Slot 7+10')
    getByText('Connected')
  })
})
