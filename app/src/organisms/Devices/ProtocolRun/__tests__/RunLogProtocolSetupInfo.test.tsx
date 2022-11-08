import * as React from 'react'
import { when } from 'jest-when'

import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'

import { i18n } from '../../../../i18n'
import { useProtocolDetailsForRun, useRunPipetteInfoByMount } from '../../hooks'
import { RunLogProtocolSetupInfo } from '../RunLogProtocolSetupInfo'

import type {
  RunTimeCommand,
  LabwareDefinition2,
  LegacySchemaAdapterOutput,
} from '@opentrons/shared-data'

jest.mock('../../hooks')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseRunPipetteInfoByMount = useRunPipetteInfoByMount as jest.MockedFunction<
  typeof useRunPipetteInfoByMount
>

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as LegacySchemaAdapterOutput

const TEMP_ID = 'temperature_module_gen2'
const TC_ID = 'thermocycler'
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
} as RunTimeCommand
const COMMAND_TYPE_TRASH = {
  commandType: 'loadLabware',
  params: {
    labwareId: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
    location: LABWARE_LOCATION,
  },
  result: {
    definition: {
      metadata: {
        displayName: 'Trash',
      },
    },
  },
} as RunTimeCommand
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
} as RunTimeCommand
const COMMAND_TYPE_LOAD_MODULE = {
  commandType: 'loadModule',
  params: {
    moduleId: 'temperature_module_gen2',
    location: MODULE_LOCATION,
  },
  result: {
    moduleId: 'temperature_module_gen2',
  },
} as RunTimeCommand
const COMMAND_TYPE_LOAD_MODULE_TC = {
  commandType: 'loadModule',
  params: {
    moduleId: TC_ID,
    location: MODULE_LOCATION,
  },
  result: {
    moduleId: TC_ID,
  },
} as RunTimeCommand
const COMMAND_TYPE_LOAD_PIPETTE = {
  commandType: 'loadPipette',
  params: {
    pipetteId: '300uL_multichannel',
    mount: 'left',
  },
  result: {
    pipetteId: '300uL_multichannel',
  },
} as RunTimeCommand

const ROBOT_NAME = 'otie'
const RUN_ID = 'ab60e8ff-e281-4219-9f7c-61fc816482dd'
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

const mockPipetteInfo = {
  requestedPipetteMatch: 'incompatible',
  pipetteCalDate: null,
  pipetteSpecs: {
    displayName: 'P10 Single-Channel',
  },
  tipRacksForPipette: [],
} as any

const mockPipetteInfoByMount = {
  left: mockPipetteInfo,
  right: null,
} as any

const render = (
  props: React.ComponentProps<typeof RunLogProtocolSetupInfo>
) => {
  return renderWithProviders(<RunLogProtocolSetupInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RunLogProtocolSetupInfo', () => {
  let props: React.ComponentProps<typeof RunLogProtocolSetupInfo>
  beforeEach(() => {
    props = {
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      setupCommand: COMMAND_TYPE_LOAD_LABWARE,
    }
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
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
            [TEMP_ID]: {
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
    mockUseRunPipetteInfoByMount.mockReturnValue(mockPipetteInfoByMount)
  })

  it('should render correct command when commandType is loadLabware', () => {
    const { getByText } = render(props)
    getByText('Load ANSI 96 Standard Microplate v1 in Slot 3')
  })

  it('should render correct command when commandType is loadLabware on top of a module', () => {
    props = {
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      setupCommand: COMMAND_TYPE_LOAD_LABWARE_WITH_MODULE,
    }
    when(mockUseProtocolDetailsForRun).calledWith(RUN_ID).mockReturnValue({
      protocolData: simpleV6Protocol,
      displayName: 'mock display name',
      protocolKey: 'fakeProtocolKey',
      robotType: 'OT-2 Standard',
    })
    const { getByText } = render(props)
    getByText(
      'Load ANSI 96 Standard Microplate v1 in Magnetic Module GEN2 in Slot 3'
    )
  })
  it('should render correct command when commandType is loadPipette', () => {
    props = {
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      setupCommand: COMMAND_TYPE_LOAD_PIPETTE,
    }
    const { getByText } = render(props)
    getByText(nestedTextMatcher('Load P10 Single-Channel in Left Mount'))
  })
  it('should render correct command when commandType is loadModule', () => {
    props = {
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      setupCommand: COMMAND_TYPE_LOAD_MODULE,
    }
    const { getByText } = render(props)
    getByText('Load Temperature Module GEN2 in Slot 3')
  })
  it('should render correct command when commandType is loadModule and a TC is used', () => {
    props = {
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      setupCommand: COMMAND_TYPE_LOAD_MODULE_TC,
    }
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
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
            [TC_ID]: {
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
    getByText('Load Thermocycler Module GEN1')
  })
  it('renders null if protocol data is null', () => {
    mockUseProtocolDetailsForRun.mockReturnValue({ protocolData: null } as any)
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
  it('renders null if SetupCommand is undefined', () => {
    props = {
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      setupCommand: undefined,
    }
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
  it('renders null if labware is a trash', () => {
    props = {
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      setupCommand: COMMAND_TYPE_TRASH,
    }
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
})
