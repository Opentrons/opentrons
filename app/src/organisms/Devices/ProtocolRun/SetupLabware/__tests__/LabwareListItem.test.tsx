import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { StaticRouter } from 'react-router-dom'

import { opentrons96PcrAdapterV1 } from '@opentrons/shared-data'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '../../../../../__testing-utils__'
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
import type {
  LoadLabwareRunTimeCommand,
  ModuleModel,
  ModuleType,
  LabwareDefinition2,
  LoadModuleRunTimeCommand,
} from '@opentrons/shared-data'
import type { AttachedModule } from '../../../../../redux/modules/types'
import type { ModuleRenderInfoForProtocol } from '../../../hooks'

vi.mock('../SecureLabwareModal')
vi.mock('@opentrons/react-api-client')

const mockAdapterDef = opentrons96PcrAdapterV1 as LabwareDefinition2
const mockAdapterId = 'mockAdapterId'
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
  const mockCreateLiveCommand = vi.fn()
  beforeEach(() => {
    mockCreateLiveCommand.mockResolvedValue(null)
    vi.mocked(SecureLabwareModal).mockReturnValue(
      <div>mock secure labware modal</div>
    )
    vi.mocked(useCreateLiveCommandMutation).mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })

  it('renders the correct info for a thermocycler (OT2), clicking on secure labware instructions opens the modal', () => {
    render({
      commands: [],
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
      isFlex: false,
      nestedLabwareInfo: null,
    })
    screen.getByText('Mock Labware Definition')
    screen.getByText('nickName')
    screen.getByText('Thermocycler Module GEN1')
    screen.getByText('7,8,10,11')
    const button = screen.getByText('Secure labware instructions')
    fireEvent.click(button)
    screen.getByText('mock secure labware modal')
    screen.getByText('nickName')
  })

  it('renders the correct info for a thermocycler (OT3)', () => {
    render({
      commands: [],
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
      isFlex: true,
      nestedLabwareInfo: null,
    })
    screen.getByText('Mock Labware Definition')
    screen.getByText('A1+B1')
    screen.getByText('Thermocycler Module GEN1')
  })

  it('renders the correct info for a labware on top of a magnetic module', () => {
    render({
      commands: [],
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
      isFlex: false,
      nestedLabwareInfo: null,
    })
    screen.getByText('Mock Labware Definition')
    screen.getByTestId('slot_info_7')
    screen.getByText('Magnetic Module GEN1')
    const button = screen.getByText('Secure labware instructions')
    fireEvent.click(button)
    screen.getByText('mock secure labware modal')
    screen.getByText('nickName')
  })

  it('renders the correct info for a labware on top of a temperature module', () => {
    render({
      commands: [],
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
      isFlex: false,
      nestedLabwareInfo: null,
    })
    screen.getByText('Mock Labware Definition')
    screen.getByTestId('slot_info_7')
    screen.getByText('Temperature Module GEN1')
    screen.getByText('nickName')
  })

  it('renders the correct info for a labware on an adapter on top of a temperature module', () => {
    const mockAdapterLoadCommand: LoadLabwareRunTimeCommand = {
      commandType: 'loadLabware',
      params: {
        location: { moduleId: mockModuleId },
      },
      result: {
        labwareId: mockAdapterId,
        definition: mockAdapterDef,
      },
      offsets: {
        x: 0,
        y: 1,
        z: 1.2,
      },
    } as any
    const mockModuleLoadCommand: LoadModuleRunTimeCommand = {
      commandType: 'loadModule',
      params: {
        moduleId: mockModuleId,
        location: { slotName: '7' },
        model: 'temperatureModuleV2',
      },
      result: {
        moduleId: mockModuleId,
      },
    } as any

    render({
      commands: [mockAdapterLoadCommand, mockModuleLoadCommand],
      nickName: mockNickName,
      definition: mockLabwareDef,
      initialLocation: { labwareId: mockAdapterId },
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
      isFlex: false,
      nestedLabwareInfo: {
        nestedLabwareDisplayName: 'mock nested display name',
        sharedSlotId: '7',
        nestedLabwareNickName: 'nestedLabwareNickName',
        nestedLabwareDefinition: mockLabwareDef,
      },
    })
    screen.getByText('Mock Labware Definition')
    screen.getAllByText('7')
    screen.getByText('Temperature Module GEN2')
    screen.getByText('mock nested display name')
    screen.getByText('nestedLabwareNickName')
    screen.getByText('nickName')
  })

  it('renders the correct info for a labware on an adapter on the deck', () => {
    const mockAdapterLoadCommand: LoadLabwareRunTimeCommand = {
      commandType: 'loadLabware',
      params: {
        location: { slotName: 'A2' },
      },
      result: {
        labwareId: mockAdapterId,
        definition: mockAdapterDef,
      },
      offsets: {
        x: 0,
        y: 1,
        z: 1.2,
      },
    } as any

    render({
      commands: [mockAdapterLoadCommand],
      nickName: mockNickName,
      definition: mockLabwareDef,
      initialLocation: { labwareId: mockAdapterId },
      moduleModel: null,
      moduleLocation: null,
      extraAttentionModules: [],
      attachedModuleInfo: {},
      isFlex: false,
      nestedLabwareInfo: {
        nestedLabwareDisplayName: 'mock nested display name',
        sharedSlotId: 'A2',
        nestedLabwareNickName: 'nestedLabwareNickName',
        nestedLabwareDefinition: mockLabwareDef,
      },
    })
    screen.getByText('Mock Labware Definition')
    screen.getByText('A2')
    screen.getByText('mock nested display name')
    screen.getByText('nestedLabwareNickName')
    screen.getByText('nickName')
    screen.getByText('On deck')
  })

  it('renders the correct info for a labware on top of a heater shaker', () => {
    render({
      nickName: mockNickName,
      commands: [],
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
      isFlex: false,
      nestedLabwareInfo: null,
    })
    screen.getByText('Mock Labware Definition')
    screen.getByTestId('slot_info_7')
    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('nickName')
    screen.getByText('To add labware, use the toggle to control the latch')
    screen.getByText('Labware Latch')
    screen.getByText('Secure')
    const button = screen.getByLabelText('heater_shaker_7_latch_toggle')
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
    render({
      nickName: null,
      definition: mockLabwareDef,
      initialLocation: 'offDeck',
      commands: [],
      moduleModel: null,
      moduleLocation: null,
      extraAttentionModules: [],
      attachedModuleInfo: {},
      isFlex: false,
      nestedLabwareInfo: null,
    })
    screen.getByText('Mock Labware Definition')
    screen.getByText('Off deck')
  })
})
