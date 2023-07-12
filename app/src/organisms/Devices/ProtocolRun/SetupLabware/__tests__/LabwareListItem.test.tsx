import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { StaticRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import {
  mockHeaterShaker,
  mockMagneticModule,
  mockTemperatureModule,
  mockThermocycler,
} from '../../../../../redux/modules/__fixtures__'
import { mockLabwareDef } from '../../../../LabwarePositionCheck/__fixtures__/mockLabwareDef'
import { SecureLabwareModal } from '../SecureLabwareModal'
import { LabwareListItem } from '../LabwareListItem'
import type { ModuleModel, ModuleType } from '@opentrons/shared-data'
import type { AttachedModule } from '../../../../../redux/modules/types'
import type { ModuleRenderInfoForProtocol } from '../../../hooks'

jest.mock('../SecureLabwareModal')
jest.mock('@opentrons/react-api-client')

const mockSecureLabwareModal = SecureLabwareModal as jest.MockedFunction<
  typeof SecureLabwareModal
>
const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>

const mockNestedLabwareDisplayName = 'nested labware display name'
const mockLocationInfo = {
  labwareOffset: { x: 1, y: 1, z: 1 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}
const mockAttachedModuleInfo = {
  x: 1,
  y: 1,
  z: 1,
  nestedLabwareDef: mockLabwareDef,
  nestedLabwareId: '1',
  nestedLabwareDisplayName: mockNestedLabwareDisplayName,
  protocolLoadOrder: 0,
  slotName: '7',
}
const mockModuleSlot = { slotName: '7' }
const mockThermocyclerModuleDefinition = {
  moduleId: 'someThermocyclerModule',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleType,
  ...mockLocationInfo,
}
const mockModuleId = 'moduleId'
const mockNickName = 'nickName'

const render = (props: React.ComponentProps<typeof LabwareListItem>) => {
  return renderWithProviders(
    <StaticRouter>
      <LabwareListItem {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('LabwareListItem', () => {
  const mockCreateLiveCommand = jest.fn()
  beforeEach(() => {
    mockCreateLiveCommand.mockResolvedValue(null)
    mockSecureLabwareModal.mockReturnValue(<div>mock secure labware modal</div>)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })

  it('renders the correct info for a thermocycler (OT2), clicking on secure labware instructions opens the modal', () => {
    const { getByText } = render({
      nickName: mockNickName,
      definition: mockLabwareDef,
      initialLocation: { moduleId: mockModuleId },
      moduleModel: 'thermocyclerModuleV1' as ModuleModel,
      moduleLocation: mockModuleSlot,
      extraAttentionModules: ['thermocyclerModuleType'],
      attachedModuleInfo: {
        [mockModuleId]: ({
          moduleId: 'thermocyclerModuleId',
          attachedModuleMatch: (mockThermocycler as any) as AttachedModule,
          moduleDef: mockThermocyclerModuleDefinition as any,
          ...mockAttachedModuleInfo,
        } as any) as ModuleRenderInfoForProtocol,
      },
      isOt3: false,
    })
    getByText('Mock Labware Definition')
    getByText('Slot 7,8,10,11, Thermocycler Module GEN1')
    const button = getByText('Secure labware instructions')
    fireEvent.click(button)
    getByText('mock secure labware modal')
    getByText('nickName')
  })

  it('renders the correct info for a thermocycler (OT3)', () => {
    const { getByText } = render({
      nickName: mockNickName,
      definition: mockLabwareDef,
      initialLocation: { moduleId: mockModuleId },
      moduleModel: 'thermocyclerModuleV1' as ModuleModel,
      moduleLocation: mockModuleSlot,
      extraAttentionModules: ['thermocyclerModuleType'],
      attachedModuleInfo: {
        [mockModuleId]: ({
          moduleId: 'thermocyclerModuleId',
          attachedModuleMatch: (mockThermocycler as any) as AttachedModule,
          moduleDef: mockThermocyclerModuleDefinition as any,
          ...mockAttachedModuleInfo,
        } as any) as ModuleRenderInfoForProtocol,
      },
      isOt3: true,
    })
    getByText('Mock Labware Definition')
    getByText('Slot A1+B1, Thermocycler Module GEN1')
  })

  it('renders the correct info for a labware on top of a magnetic module', () => {
    const { getByText } = render({
      nickName: mockNickName,
      definition: mockLabwareDef,
      initialLocation: { moduleId: mockModuleId },
      moduleModel: 'magneticModuleV1' as ModuleModel,
      moduleLocation: mockModuleSlot,
      extraAttentionModules: ['magneticModuleType'],
      attachedModuleInfo: {
        [mockModuleId]: ({
          moduleId: 'magneticModuleId',

          attachedModuleMatch: (mockMagneticModule as any) as AttachedModule,
          moduleDef: {
            moduleId: 'someMagneticModule',
            model: 'magneticModuleV2' as ModuleModel,
            type: 'magneticModuleType' as ModuleType,
            ...mockLocationInfo,
          } as any,
          ...mockAttachedModuleInfo,
        } as any) as ModuleRenderInfoForProtocol,
      },
      isOt3: false,
    })
    getByText('Mock Labware Definition')
    getByText('Slot 7, Magnetic Module GEN1')
    const button = getByText('Secure labware instructions')
    fireEvent.click(button)
    getByText('mock secure labware modal')
    getByText('nickName')
  })

  it('renders the correct info for a labware on top of a temperature module', () => {
    const { getByText } = render({
      nickName: mockNickName,
      definition: mockLabwareDef,
      initialLocation: { moduleId: mockModuleId },
      moduleModel: 'temperatureModuleV1' as ModuleModel,
      moduleLocation: mockModuleSlot,
      extraAttentionModules: [],
      attachedModuleInfo: {
        [mockModuleId]: ({
          moduleId: 'temperatureModuleId',
          attachedModuleMatch: (mockTemperatureModule as any) as AttachedModule,
          moduleDef: {
            moduleId: 'someTemperatureModule',
            model: 'temperatureModuleV2' as ModuleModel,
            type: 'temperatureModuleType' as ModuleType,
            ...mockLocationInfo,
          } as any,
          ...mockAttachedModuleInfo,
        } as any) as ModuleRenderInfoForProtocol,
      },
      isOt3: false,
    })
    getByText('Mock Labware Definition')
    getByText('Slot 7, Temperature Module GEN1')
    getByText('nickName')
  })

  it('renders the correct info for a labware on top of a heater shaker', () => {
    const { getByText, getByLabelText } = render({
      nickName: mockNickName,
      definition: mockLabwareDef,
      initialLocation: { moduleId: mockModuleId },
      moduleModel: 'heaterShakerModuleV1' as ModuleModel,
      moduleLocation: mockModuleSlot,
      extraAttentionModules: ['heaterShakerModuleType'],
      attachedModuleInfo: {
        [mockModuleId]: ({
          moduleId: 'heaterShakerModuleId',
          attachedModuleMatch: (mockHeaterShaker as any) as AttachedModule,
          moduleDef: {
            moduleId: 'someheaterShakerModule',
            model: 'heaterShakerModuleV1' as ModuleModel,
            type: 'heaterShakerModuleType' as ModuleType,
            ...mockLocationInfo,
          } as any,
          ...mockAttachedModuleInfo,
        } as any) as ModuleRenderInfoForProtocol,
      },
      isOt3: false,
    })
    getByText('Mock Labware Definition')
    getByText('Slot 7, Heater-Shaker Module GEN1')
    getByText('nickName')
    getByText('To add labware, use the toggle to control the latch')
    getByText('Labware Latch')
    getByText('Secure')
    const button = getByLabelText('heater_shaker_7_latch_toggle')
    fireEvent.click(button)
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/closeLabwareLatch',
        params: {
          moduleId: mockHeaterShaker.id,
        },
      },
    })
  })

  it('renders the correct info for an off deck labware', () => {
    const { getByText } = render({
      nickName: null,
      definition: mockLabwareDef,
      initialLocation: 'offDeck',
      moduleModel: null,
      moduleLocation: null,
      extraAttentionModules: [],
      attachedModuleInfo: {},
      isOt3: false,
    })
    getByText('Mock Labware Definition')
  })
})
