import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import _uncastedProtocolWithTC from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { mockDefinition } from '../../../../../redux/custom-labware/__fixtures__'
import { SetupLabwareList } from '../SetupLabwareList'
import { LabwareListItem } from '../LabwareListItem'
import type {
  ProtocolAnalysisFile,
  RunTimeCommand,
} from '@opentrons/shared-data'

jest.mock('../LabwareListItem')

const protocolWithTC = (_uncastedProtocolWithTC as unknown) as ProtocolAnalysisFile

const mockLabwareListItem = LabwareListItem as jest.MockedFunction<
  typeof LabwareListItem
>

const render = (props: React.ComponentProps<typeof SetupLabwareList>) => {
  return renderWithProviders(
    <StaticRouter>
      <SetupLabwareList {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

const mockOffDeckCommands = ([
  {
    id: '0abc1',
    commandType: 'loadPipette',
    params: {
      pipetteId: 'pipetteId',
      mount: 'left',
    },
  },
  {
    id: '0abc2',
    commandType: 'loadLabware',
    params: {
      labwareId: 'fixedTrash',
      location: {
        slotName: '12',
      },
    },
    result: {
      labwareId: 'fixedTrash',
      definition: {
        ordering: [['A1']],
        metadata: {
          displayCategory: 'trash',
          displayName: 'Opentrons Fixed Trash',
        },
      },
    },
  },
  {
    id: '0abc3',
    commandType: 'loadLabware',
    params: {
      labwareId: 'tiprackId',
      location: {
        slotName: '1',
      },
    },
    result: {
      labwareId: 'labwareId',
      definition: mockDefinition,
    },
  },
  {
    id: '0abc4',
    commandType: 'loadLabware',
    params: {
      labwareId: 'sourcePlateId',
      location: {
        slotName: '2',
      },
    },
    result: {
      labwareId: 'labwareId',
      definition: mockDefinition,
    },
  },
  {
    id: '0abc4',
    commandType: 'loadLabware',
    params: {
      labwareId: 'destPlateId',
      location: {
        slotName: '3',
      },
    },
    result: {
      labwareId: 'labwareId',
      definition: mockDefinition,
    },
  },
  {
    id: '0',
    commandType: 'pickUpTip',
    params: {
      pipetteId: 'pipetteId',
      labwareId: 'tiprackId',
      wellName: 'B1',
    },
  },
  {
    id: '1',
    commandType: 'aspirate',
    params: {
      pipetteId: 'pipetteId',
      labwareId: 'sourcePlateId',
      wellName: 'A1',
      volume: 5,
      flowRate: 3,
      wellLocation: {
        origin: 'bottom',
        offset: { x: 0, y: 0, z: 2 },
      },
    },
  },
  {
    id: '2',
    commandType: 'dispense',
    params: {
      pipetteId: 'pipetteId',
      labwareId: 'destPlateId',
      wellName: 'B1',
      volume: 4.5,
      flowRate: 2.5,
      wellLocation: {
        origin: 'bottom',
        offset: { x: 0, y: 0, z: 1 },
      },
    },
  },
  {
    id: '3',
    commandType: 'dropTip',
    params: {
      pipetteId: 'pipetteId',
      labwareId: 'fixedTrash',
      wellName: 'A1',
    },
  },
  {
    id: '4',
    commandType: 'loadLabware',
    params: {
      labwareId: 'fixedTrash',
      location: 'offDeck',
    },
    result: {
      labwareId: 'labwareId',
      definition: mockDefinition,
    },
  },
] as any) as RunTimeCommand[]

describe('SetupLabwareList', () => {
  beforeEach(() => {
    mockLabwareListItem.mockReturnValue(<div>mock labware list item</div>)
  })
  it('renders the correct headers and labware list items', () => {
    const { getAllByText, getByText } = render({
      commands: protocolWithTC.commands,
      extraAttentionModules: [],
      attachedModuleInfo: {
        x: 1,
        y: 2,
        z: 3,
        attachedModuleMatch: null,
        moduleId: 'moduleId',
      } as any,
      isFlex: false,
    })

    getAllByText('mock labware list item')
    getByText('Labware name')
    getByText('Location')
    getByText('Placement')
  })
  it('renders null for the offdeck labware list when there are none', () => {
    const { queryByText } = render({
      commands: protocolWithTC.commands,
      extraAttentionModules: [],
      attachedModuleInfo: {
        x: 1,
        y: 2,
        z: 3,
        attachedModuleMatch: null,
        moduleId: 'moduleId',
      } as any,
      isFlex: false,
    })
    expect(queryByText('Additional Off-Deck Labware')).not.toBeInTheDocument()
  })

  it('renders offdeck labware list when there are additional offdeck labwares', () => {
    const { getAllByText, getByText } = render({
      commands: mockOffDeckCommands,
      extraAttentionModules: [],
      attachedModuleInfo: {} as any,
      isFlex: false,
    })
    getByText('Additional Off-Deck Labware')
    getAllByText('mock labware list item')
  })
})
