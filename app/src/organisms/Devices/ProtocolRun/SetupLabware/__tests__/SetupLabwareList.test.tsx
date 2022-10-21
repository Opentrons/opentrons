import * as React from 'react'
import { when } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'
import _protocolWithMagTempTC from '@opentrons/shared-data/protocol/fixtures/6/transferSettings.json'
import _protocolWithHS from '@opentrons/shared-data/protocol/fixtures/6/heaterShakerCommandsWithResult.json'
import { i18n } from '../../../../../i18n'
import { SecureLabwareModal } from '../../../../ProtocolSetup/RunSetupCard/LabwareSetup/SecureLabwareModal'
import { RUN_ID_1 } from '../../../../RunTimeControl/__fixtures__'
import { useProtocolDetailsForRun } from '../../../hooks'
import { getAllLabwareAndTiprackIdsInOrder } from '../utils'
import { SetupLabwareList } from '../SetupLabwareList'
import type {
  ModuleModel,
  ModuleType,
  ProtocolAnalysisFile,
} from '@opentrons/shared-data'
import type { AttachedModule } from '@opentrons/api-client'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    RobotWorkSpace: jest.fn(() => <div>mock RobotWorkSpace</div>),
  }
})
jest.mock('../../../hooks')
jest.mock(
  '../../../../ProtocolSetup/RunSetupCard/LabwareSetup/SecureLabwareModal'
)
jest.mock('../utils')
jest.mock('@opentrons/react-api-client')

const mockUseCreateLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockSecureLabwareModal = SecureLabwareModal as jest.MockedFunction<
  typeof SecureLabwareModal
>
const mockGetAllLabwareAndTiprackIdsInOrder = getAllLabwareAndTiprackIdsInOrder as jest.MockedFunction<
  typeof getAllLabwareAndTiprackIdsInOrder
>
const render = (props: React.ComponentProps<typeof SetupLabwareList>) => {
  return renderWithProviders(<SetupLabwareList {...props} />, {
    i18nInstance: i18n,
  })
}
const protocolWithMagTempTC = (_protocolWithMagTempTC as unknown) as ProtocolAnalysisFile
const protocolWithHS = (_protocolWithHS as unknown) as ProtocolAnalysisFile
const heaterShakerId =
  '3e012450-3412-11eb-ad93-ed232a2337cf:heaterShakerModuleType'
const mockHeaterShaker = {
  moduleId: 'someHeaterShakerModule',
  model: 'heaterShakerModuleV1' as ModuleModel,
  moduleType: 'heaterShakerModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  calibrationPoint: { x: 0, y: 0 },
  displayName: 'Heater Shaker Module',
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
  quirks: [],
}

const mockHeaterShakerAttachedModule = {
  id: '3e012450-3412-11eb-ad93-ed232a2337cf:heaterShakerModuleType',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: false,
  data: {
    labwareLatchStatus: 'idle_open',
    speedStatus: 'idle',
    temperatureStatus: 'heating',
    currentSpeed: null,
    currentTemperature: 50,
    targetSpeed: null,
    targetTemperature: 60,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', hub: null, port: 1 },
}
describe('SetupLabwareList', () => {
  let props: React.ComponentProps<typeof SetupLabwareList>
  let mockCreateLiveCommand = jest.fn()
  beforeEach(() => {
    props = {
      runId: RUN_ID_1,
      extraAttentionModules: ['thermocyclerModuleType', 'magneticModuleType'],
      attachedModuleInfo: {},
    }

    when(mockUseProtocolDetailsForRun).calledWith(RUN_ID_1).mockReturnValue({
      displayName: null,
      protocolData: protocolWithMagTempTC,
      protocolKey: null,
    })
    mockSecureLabwareModal.mockReturnValue(<div>mock secure labware modal</div>)
    mockGetAllLabwareAndTiprackIdsInOrder.mockReturnValue([
      'aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      '3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1',
      'ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1',
      '5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/1',
      '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      '53d3b350-a9c0-11eb-bce6-9f1d5b9c1a1b',
      'b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      'faa13a50-a9bf-11eb-bce6-9f1d5b9c1a1b:opentrons/opentrons_96_tiprack_20ul/1',
    ])
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockUseCreateLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })

  it('renders all the labware and the correct info', () => {
    const [{ getByText, getAllByText }] = render(props)
    getByText('Labware Name')
    getByText('Initial Location')
    getByText('Opentrons 96 Tip Rack 1000 µL')
    getAllByText('NEST 1 Well Reservoir 195 mL')
    getAllByText('NEST 96 Well Plate 100 µL PCR Full Skirt')
    getByText('Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 µL')
    getByText('Opentrons 96 Tip Rack 20 µL')
    getAllByText('mock RobotWorkSpace')
    getByText('Slot 7+10, Thermocycler Module GEN1')
    getByText('Slot 3, Temperature Module GEN2')
    getByText('Slot 5')
  })

  it('renders the extra attention information for magnetic module and clicking the button renders the modal', () => {
    const [{ getByText, getByTestId, getAllByText }] = render(props)
    getAllByText('Secure labware instructions')
    const magneticMod = getByTestId('SetupLabwareList_magneticModuleType_0')
    fireEvent.click(magneticMod)
    getByText('mock secure labware modal')
  })

  it('renders the extra attention information for thermocycler module and clicking the button renders the modal', () => {
    const [{ getByText, getByTestId, getAllByText }] = render(props)
    getAllByText('Secure labware instructions')
    const tcMod = getByTestId('SetupLabwareList_thermocyclerModuleType_6')
    fireEvent.click(tcMod)
    getByText('mock secure labware modal')
  })

  it('renders the correct info when heater shaker is in the protocol but not attached, so button is disabled', () => {
    when(mockUseProtocolDetailsForRun).calledWith(RUN_ID_1).mockReturnValue({
      displayName: null,
      protocolData: protocolWithHS,
      protocolKey: null,
    })
    props = {
      runId: RUN_ID_1,
      extraAttentionModules: ['heaterShakerModuleType'],
      attachedModuleInfo: {},
    }
    const [{ getByTestId, getByText }] = render(props)
    getByText('To add labware, use the toggle to control the latch')
    getByText('Labware Latch')
    const hS = getByTestId('SetupLabwareList_toggleHeaterShaker_0')
    expect(hS).toBeDisabled()
  })

  it('renders the correct info when heater shaker is in the protocol and is attached, pressing on button sends command', () => {
    when(mockUseProtocolDetailsForRun).calledWith(RUN_ID_1).mockReturnValue({
      displayName: null,
      protocolData: protocolWithHS,
      protocolKey: null,
    })
    props = {
      runId: RUN_ID_1,
      extraAttentionModules: ['heaterShakerModuleType'],
      attachedModuleInfo: {
        [heaterShakerId]: {
          moduleId: heaterShakerId,
          x: 1,
          y: 1,
          z: 1,
          moduleDef: mockHeaterShaker as any,
          nestedLabwareDisplayName: 'Source Plate',
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 0,
          slotName: '1',
          attachedModuleMatch: mockHeaterShakerAttachedModule as AttachedModule,
        },
      },
    }
    const [{ getByRole, getByText }] = render(props)
    getByText('To add labware, use the toggle to control the latch')
    getByText('Labware Latch')
    const toggle = getByRole('switch', { name: 'heaterShaker_0' })
    toggle.click()
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/closeLabwareLatch',
        params: {
          moduleId: mockHeaterShakerAttachedModule.id,
        },
      },
    })
  })
})
