import * as React from 'react'
import { when } from 'jest-when'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import { i18n } from '../../../i18n'
import * as discoverySelectors from '../../../redux/discovery/selectors'
import { ProtocolPipetteTipRackCalDataByMount } from '../../../redux/pipettes/types'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { mockProtocolPipetteTipRackCalInfo } from '../../../redux/pipettes/__fixtures__'
import { getProtocolPipetteTipRackCalInfo } from '../../../redux/pipettes'
import { ProtocolSetupInfo } from '../ProtocolSetupInfo'
import { useProtocolDetails } from '../hooks'
import { ProtocolFile } from '@opentrons/shared-data'
import type { Command, LabwareDefinition2 } from '@opentrons/shared-data'

jest.mock('../hooks')
jest.mock('../../../redux/pipettes/types')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../../../redux/pipettes')

const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockGetProtocolPipetteTiprackData = getProtocolPipetteTipRackCalInfo as jest.MockedFunction<
  typeof getProtocolPipetteTipRackCalInfo
>
const mockGetConnectedRobot = discoverySelectors.getConnectedRobot as jest.MockedFunction<
  typeof discoverySelectors.getConnectedRobot
>

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolFile<{}>

const LABWARE_LOCATION = { slotName: '3' }
const MODULE_LOCATION = { slotName: '3' } || {
  coordinates: { x: 0, y: 0, z: 0 },
}

const COMMAND_TYPE_LOAD_LABWARE = {
  commandType: 'loadLabware',
  params: {
    labwareId: '96_wellplate',
    location: LABWARE_LOCATION,
  },
  result: {
    labwareId: '96_wellplate',
    definition: fixture_96_plate as LabwareDefinition2,
    offset: { x: 0, y: 0, z: 0 },
  },
} as Command
const COMMAND_TYPE_TRASH = {
  commandType: 'loadLabware',
  params: {
    labwareId: 'trashId',
    location: LABWARE_LOCATION,
  },
} as Command
const LABWARE_LOCATION_WITH_MODULE = {
  moduleId: 'magneticModuleId',
}
const COMMAND_TYPE_LOAD_LABWARE_WITH_MODULE = {
  commandType: 'loadLabware',
  params: {
    labwareId: '96_wellplate',
    location: LABWARE_LOCATION_WITH_MODULE,
  },
  result: {
    labwareId: '96_wellplate',
    definition: fixture_96_plate as LabwareDefinition2,
    offset: { x: 0, y: 0, z: 0 },
  },
} as Command
const COMMAND_TYPE_LOAD_MODULE = {
  commandType: 'loadModule',
  params: {
    moduleId: 'temperature_module_gen2',
    location: MODULE_LOCATION,
  },
  result: {
    moduleId: 'temperature_module_gen2',
  },
} as Command
const COMMAND_TYPE_LOAD_MODULE_TC = {
  commandType: 'loadModule',
  params: {
    moduleId: 'thermocycler',
    location: MODULE_LOCATION,
  },
  result: {
    moduleId: 'thermocycler',
  },
} as Command
const COMMAND_TYPE_LOAD_PIPETTE = {
  commandType: 'loadPipette',
  params: {
    pipetteId: '300uL_multichannel',
    mount: 'left',
  },
  result: {
    pipetteId: '300uL_multichannel',
  },
} as Command

const PICKUP_TIP_LABWARE_ID = 'PICKUP_TIP_LABWARE_ID'
const PRIMARY_PIPETTE_ID = 'My Pipette'
const PRIMARY_PIPETTE_NAME = 'PRIMARY_PIPETTE_NAME'
const LABWARE_DEF_ID = 'LABWARE_DEF_ID'
const LABWARE_DEF = {
  ordering: [['A1', 'A2']],
}
const mockLabwarePositionCheckStepTipRack = {
  labwareId:
    '1d57fc10-67ad-11ea-9f8b-3b50068bd62d:opentrons/opentrons_96_filtertiprack_200ul/1',
  section: '',
  commands: [
    {
      command: 'pickUpTip',
      params: {
        pipette: PRIMARY_PIPETTE_ID,
        labware: PICKUP_TIP_LABWARE_ID,
      },
    },
  ],
} as any

const mockProtocolPipetteTipRackCalData: ProtocolPipetteTipRackCalDataByMount = {
  left: mockProtocolPipetteTipRackCalInfo,
  right: null,
} as any

const render = (props: React.ComponentProps<typeof ProtocolSetupInfo>) => {
  return renderWithProviders(<ProtocolSetupInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolSetupInfo', () => {
  let props: React.ComponentProps<typeof ProtocolSetupInfo>
  beforeEach(() => {
    props = { onCloseClick: jest.fn(), SetupCommand: COMMAND_TYPE_LOAD_LABWARE }
    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({
        protocolData: {
          labware: {
            [mockLabwarePositionCheckStepTipRack.labwareId]: {
              slot: '3',
              displayName: 'someDislpayName',
              definitionId: LABWARE_DEF_ID,
            },
          },
          labwareDefinitions: {
            [LABWARE_DEF_ID]: LABWARE_DEF,
          },
          modules: {
            ['temperature_module_gen2']: {
              slot: '3',
              model: 'temperatureModuleV2',
            },
          },
          pipettes: {
            [PRIMARY_PIPETTE_ID]: {
              name: PRIMARY_PIPETTE_NAME,
              mount: 'left',
            },
          },
        },
      } as any)
    mockGetProtocolPipetteTiprackData.mockReturnValue(
      mockProtocolPipetteTipRackCalData
    )
    mockGetConnectedRobot.mockReturnValue(mockConnectedRobot)
  })
  it('should render correct Protocol Setup text', () => {
    const { getByText } = render(props)
    getByText('Protocol Setup')
  })

  it('should render correct command when commandType is loadLabware', () => {
    const { getByText } = render(props)
    getByText('Load ANSI 96 Standard Microplate v1 in Slot 3')
  })

  it('should render correct command when commandType is loadLabware on top of a module', () => {
    props = {
      onCloseClick: jest.fn(),
      SetupCommand: COMMAND_TYPE_LOAD_LABWARE_WITH_MODULE,
    }
    when(mockUseProtocolDetails).calledWith().mockReturnValue({
      //  @ts-expect-error commandAnnotations doesn't exist on v5
      protocolData: simpleV6Protocol,
      displayName: 'mock display name',
    })
    const { getByText } = render(props)
    getByText(
      'Load ANSI 96 Standard Microplate v1 in Magnetic Module GEN2 in Slot 3'
    )
  })
  it('should render correct command when commandType is loadPipette', () => {
    props = { onCloseClick: jest.fn(), SetupCommand: COMMAND_TYPE_LOAD_PIPETTE }
    const { getByText } = render(props)
    getByText(nestedTextMatcher('Load My Pipette in left Mount'))
  })
  it('should render correct command when commandType is loadModule', () => {
    props = { onCloseClick: jest.fn(), SetupCommand: COMMAND_TYPE_LOAD_MODULE }
    const { getByText } = render(props)
    getByText('Load Temperature Module GEN2 in Slot 3')
  })
  it('should render correct command when commandType is loadModule and a TC is used', () => {
    props = {
      onCloseClick: jest.fn(),
      SetupCommand: COMMAND_TYPE_LOAD_MODULE_TC,
    }
    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({
        protocolData: {
          labware: {
            [mockLabwarePositionCheckStepTipRack.labwareId]: {
              slot: '3',
              displayName: 'someDislpayName',
              definitionId: LABWARE_DEF_ID,
            },
          },
          labwareDefinitions: {
            [LABWARE_DEF_ID]: LABWARE_DEF,
          },
          modules: {
            ['thermocycler']: {
              slot: '3',
              model: 'thermocyclerModuleV1',
            },
          },
          pipettes: {
            [PRIMARY_PIPETTE_ID]: {
              name: PRIMARY_PIPETTE_NAME,
              mount: 'left',
            },
          },
        },
      } as any)
    const { getByText } = render(props)
    getByText('Load Thermocycler Module')
  })
  it('renders null if protocol data is null', () => {
    mockUseProtocolDetails.mockReturnValue({ protocolData: null } as any)
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
  it('renders null if SetupCommand is undefined', () => {
    props = { onCloseClick: jest.fn(), SetupCommand: undefined }
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
  it('renders null if labware is a trash', () => {
    props = { onCloseClick: jest.fn(), SetupCommand: COMMAND_TYPE_TRASH }
    when(mockUseProtocolDetails).calledWith().mockReturnValue({
      //  @ts-expect-error commandAnnotations doesn't exist on v5
      protocolData: simpleV6Protocol,
      displayName: 'mock display name',
    })
    const { getByText } = render(props)
    getByText('Protocol Setup')
    expect(props.SetupCommand).toReturn
  })
})
