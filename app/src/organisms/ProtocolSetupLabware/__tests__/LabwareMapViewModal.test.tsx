import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  renderWithProviders,
  BaseDeck,
  EXTENDED_DECK_CONFIG_FIXTURE,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import deckDefFixture from '@opentrons/shared-data/deck/fixtures/3/deckExample.json'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { i18n } from '../../../i18n'
import { getSimplestDeckConfigForProtocolCommands } from '../../../resources/deck_configuration/utils'
import { getLabwareRenderInfo } from '../../Devices/ProtocolRun/utils/getLabwareRenderInfo'
import { getStandardDeckViewLayerBlockList } from '../../Devices/ProtocolRun/utils/getStandardDeckViewLayerBlockList'
import { mockProtocolModuleInfo } from '../__fixtures__'
import { LabwareMapViewModal } from '../LabwareMapViewModal'

import type {
  CompletedProtocolAnalysis,
  DeckDefinition,
  LabwareDefinition2,
  ModuleModel,
} from '@opentrons/shared-data'

jest.mock('../../Devices/ProtocolRun/utils/getLabwareRenderInfo')
jest.mock('@opentrons/components/src/hardware-sim/Labware/LabwareRender')
jest.mock('@opentrons/components/src/hardware-sim/BaseDeck')
jest.mock('../../../resources/deck_configuration/utils')
jest.mock('../../../redux/config')

const mockGetLabwareRenderInfo = getLabwareRenderInfo as jest.MockedFunction<
  typeof getLabwareRenderInfo
>
const mockGetSimplestDeckConfigForProtocolCommands = getSimplestDeckConfigForProtocolCommands as jest.MockedFunction<
  typeof getSimplestDeckConfigForProtocolCommands
>

const mockBaseDeck = BaseDeck as jest.MockedFunction<typeof BaseDeck>
const MOCK_300_UL_TIPRACK_COORDS = [30, 40, 0]

const render = (props: React.ComponentProps<typeof LabwareMapViewModal>) => {
  return renderWithProviders(
    <StaticRouter>
      <LabwareMapViewModal {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('LabwareMapViewModal', () => {
  beforeEach(() => {
    mockGetLabwareRenderInfo.mockReturnValue({})
    mockGetSimplestDeckConfigForProtocolCommands.mockReturnValue([])
  })

  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should render nothing on the deck and calls exit button', () => {
    mockBaseDeck.mockReturnValue(<div>mock base deck</div>)

    const props = {
      handleLabwareClick: jest.fn(),
      onCloseClick: jest.fn(),
      deckDef: (deckDefFixture as unknown) as DeckDefinition,
      mostRecentAnalysis: ({
        commands: [],
        labware: [],
      } as unknown) as CompletedProtocolAnalysis,
      initialLoadedLabwareByAdapter: {},
      attachedProtocolModuleMatches: [],
    }

    const { getByText, getByLabelText } = render(props)
    getByText('Map View')
    getByText('mock base deck')
    getByLabelText('closeIcon').click()
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('should render a deck with modules and labware', () => {
    const mockLabwareLocations = [
      {
        labwareLocation: { slotName: 'C1' },
        definition: fixture_tiprack_300_ul as LabwareDefinition2,
        topLabwareId: '300_ul_tiprack_id',
        onLabwareClick: expect.any(Function),
        labwareChildren: null,
      },
    ]
    const mockModuleLocations = [
      {
        moduleModel: 'heaterShakerModuleV1' as ModuleModel,
        moduleLocation: { slotName: 'B1' },
        nestedLabwareDef: mockProtocolModuleInfo[0]
          .nestedLabwareDef as LabwareDefinition2,
        onLabwareClick: expect.any(Function),
        moduleChildren: null,
        innerProps: {},
      },
    ]
    when(mockBaseDeck)
      .calledWith({
        robotType: FLEX_ROBOT_TYPE,
        deckLayerBlocklist: getStandardDeckViewLayerBlockList(FLEX_ROBOT_TYPE),
        deckConfig: EXTENDED_DECK_CONFIG_FIXTURE,
        labwareLocations: mockLabwareLocations,
        moduleLocations: mockModuleLocations,
      })
      .mockReturnValue(<div>mock base deck</div>)
    mockGetLabwareRenderInfo.mockReturnValue({
      '300_ul_tiprack_id': {
        labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
        displayName: 'fresh tips',
        x: MOCK_300_UL_TIPRACK_COORDS[0],
        y: MOCK_300_UL_TIPRACK_COORDS[1],
        z: MOCK_300_UL_TIPRACK_COORDS[2],
        slotName: 'C1',
      },
    })
    render({
      handleLabwareClick: jest.fn(),
      onCloseClick: jest.fn(),
      deckDef: (deckDefFixture as unknown) as DeckDefinition,
      mostRecentAnalysis: ({} as unknown) as CompletedProtocolAnalysis,
      initialLoadedLabwareByAdapter: {},
      attachedProtocolModuleMatches: [
        {
          ...mockProtocolModuleInfo[0],
        },
      ],
    })
    expect(mockBaseDeck).toHaveBeenCalled()
  })
})
