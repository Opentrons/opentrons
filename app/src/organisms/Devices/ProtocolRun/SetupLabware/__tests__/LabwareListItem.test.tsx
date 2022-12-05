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
import { SecureLabwareModal } from '../../../../ProtocolSetup/RunSetupCard/LabwareSetup/SecureLabwareModal'
import { LabwareListItem } from '../LabwareListItem'
import type { ModuleModel, ModuleType } from '@opentrons/shared-data'
import type { AttachedModule } from '../../../../../redux/modules/types'
import type { ModuleRenderInfoForProtocol } from '../../../hooks'

jest.mock(
  '../../../../ProtocolSetup/RunSetupCard/LabwareSetup/SecureLabwareModal'
)
jest.mock('@opentrons/react-api-client')

const mockSecureLabwareModal = SecureLabwareModal as jest.MockedFunction<
  typeof SecureLabwareModal
>
const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>

const mockThermocyclerModuleDefinition = {
  moduleId: 'someThermocyclerModule',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
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

const MODULE_ID = 'moduleId'

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
  let mockCreateLiveCommand = jest.fn()
  beforeEach(() => {
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockSecureLabwareModal.mockReturnValue(<div>mock secure labware modal</div>)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })

  it('renders the correct info for a thermocycler, clicking on secure labware instructions opens the modal', () => {
    const { getByText } = render({
      nickName: 'nickName',
      definition: mockLabwareDef,
      initialLocation: { moduleId: MODULE_ID },
      moduleModel: 'thermocyclerModuleV1' as ModuleModel,
      moduleLocation: { slotName: '7' },
      extraAttentionModules: ['thermocyclerModuleType'],
      attachedModuleInfo: {
        [MODULE_ID]: ({
          moduleId: 'thermocyclerModuleId',

          attachedModuleMatch: (mockThermocycler as any) as AttachedModule,
          x: 1,
          y: 1,
          z: 1,
          nestedLabwareDef: mockLabwareDef,
          nestedLabwareId: '1',
          nestedLabwareDisplayName: 'nested labware display name',
          protocolLoadOrder: 0,
          slotName: '7',
          moduleDef: mockThermocyclerModuleDefinition as any,
        } as any) as ModuleRenderInfoForProtocol,
      },
    })
    getByText('Mock Labware Definition')
    getByText('Slot 7+10, Thermocycler Module GEN1')
    const button = getByText('Secure labware instructions')
    fireEvent.click(button)
    getByText('mock secure labware modal')
    getByText('nickName')
  })

  it('renders the correct info for a labware on top of a magnetic module', () => {
    const { getByText } = render({
      nickName: 'nickName',
      definition: mockLabwareDef,
      initialLocation: { moduleId: MODULE_ID },
      moduleModel: 'magneticModuleV1' as ModuleModel,
      moduleLocation: { slotName: '7' },
      extraAttentionModules: ['magneticModuleType'],
      attachedModuleInfo: {
        [MODULE_ID]: ({
          moduleId: 'magneticModuleId',

          attachedModuleMatch: (mockMagneticModule as any) as AttachedModule,
          x: 1,
          y: 1,
          z: 1,
          nestedLabwareDef: mockLabwareDef,
          nestedLabwareId: '1',
          nestedLabwareDisplayName: 'nested labware display name',
          protocolLoadOrder: 0,
          slotName: '7',
          moduleDef: {
            moduleId: 'someMagneticModule',
            model: 'magneticModuleV2' as ModuleModel,
            type: 'magneticModuleType' as ModuleType,
            labwareOffset: { x: 5, y: 5, z: 5 },
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
          } as any,
        } as any) as ModuleRenderInfoForProtocol,
      },
    })
    getByText('Mock Labware Definition')
    getByText('Slot 7, Magnetic Module GEN1')
    const button = getByText('Secure labware instructions')
    fireEvent.click(button)
    getByText('mock secure labware modal')
    getByText('nickName')
  })

  it('renders the correct info for a labware on top of a temperature module ', () => {
    const { getByText } = render({
      nickName: 'nickName',
      definition: mockLabwareDef,
      initialLocation: { moduleId: MODULE_ID },
      moduleModel: 'temperatureModuleV1' as ModuleModel,
      moduleLocation: { slotName: '7' },
      extraAttentionModules: [],
      attachedModuleInfo: {
        [MODULE_ID]: ({
          moduleId: 'temperatureModuleId',
          attachedModuleMatch: (mockTemperatureModule as any) as AttachedModule,
          x: 1,
          y: 1,
          z: 1,
          nestedLabwareDef: mockLabwareDef,
          nestedLabwareId: '1',
          nestedLabwareDisplayName: 'nested labware display name',
          protocolLoadOrder: 0,
          slotName: '7',
          moduleDef: {
            moduleId: 'someTemperatureModule',
            model: 'temperatureModuleV2' as ModuleModel,
            type: 'temperatureModuleType' as ModuleType,
            labwareOffset: { x: 5, y: 5, z: 5 },
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
          } as any,
        } as any) as ModuleRenderInfoForProtocol,
      },
    })
    getByText('Mock Labware Definition')
    getByText('Slot 7, Temperature Module GEN1')
    getByText('nickName')
  })

  it('renders the correct info for a labware on top of a heater shaker', () => {
    const { getByText, getByLabelText } = render({
      nickName: 'nickName',
      definition: mockLabwareDef,
      initialLocation: { moduleId: MODULE_ID },
      moduleModel: 'heaterShakerModuleV1' as ModuleModel,
      moduleLocation: { slotName: '7' },
      extraAttentionModules: ['heaterShakerModuleType'],
      attachedModuleInfo: {
        [MODULE_ID]: ({
          moduleId: 'heaterShakerModuleId',
          attachedModuleMatch: (mockHeaterShaker as any) as AttachedModule,
          x: 1,
          y: 1,
          z: 1,
          nestedLabwareDef: mockLabwareDef,
          nestedLabwareId: '1',
          nestedLabwareDisplayName: 'nested labware display name',
          protocolLoadOrder: 0,
          slotName: '7',
          moduleDef: {
            moduleId: 'someheaterShakerModule',
            model: 'heaterShakerModuleV1' as ModuleModel,
            type: 'heaterShakerModuleType' as ModuleType,
            labwareOffset: { x: 5, y: 5, z: 5 },
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
          } as any,
        } as any) as ModuleRenderInfoForProtocol,
      },
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
    })
    getByText('Mock Labware Definition')
  })
})
