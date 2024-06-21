import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { when } from 'vitest-when'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest'

import { BaseDeck, EXTENDED_DECK_CONFIG_FIXTURE } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  deckExample as deckDefFixture,
  fixtureTiprack300ul,
} from '@opentrons/shared-data'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { getLabwareRenderInfo } from '../../Devices/ProtocolRun/utils/getLabwareRenderInfo'
import { getStandardDeckViewLayerBlockList } from '../../Devices/ProtocolRun/utils/getStandardDeckViewLayerBlockList'
import { mockProtocolModuleInfo } from '../__fixtures__'
import { LabwareMapViewModal } from '../LabwareMapViewModal'

import type {
  getSimplestDeckConfigForProtocol,
  CompletedProtocolAnalysis,
  DeckDefinition,
  LabwareDefinition2,
  ModuleModel,
} from '@opentrons/shared-data'

vi.mock('../../Devices/ProtocolRun/utils/getLabwareRenderInfo')
vi.mock('@opentrons/components/src/hardware-sim/Labware/LabwareRender')
vi.mock('@opentrons/components/src/hardware-sim/BaseDeck')
vi.mock('@opentrons/shared-data/js/helpers/getSimplestFlexDeckConfig')
vi.mock('../../../resources/deck_configuration/utils')
vi.mock('../../../redux/config')

const MOCK_300_UL_TIPRACK_COORDS = [30, 40, 0]

vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof getSimplestDeckConfigForProtocol>()
  return {
    ...actual,
    getSimplestDeckConfigForProtocol: vi.fn(),
  }
})

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof BaseDeck>()
  return {
    ...actual,
    BaseDeck: vi.fn(),
  }
})

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
    vi.mocked(getLabwareRenderInfo).mockReturnValue({})
    // vi.mocked(getSimplestDeckConfigForProtocol).mockReturnValue([])
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render nothing on the deck and calls exit button', () => {
    vi.mocked(BaseDeck).mockReturnValue(<div>mock base deck</div>)

    const props = {
      handleLabwareClick: vi.fn(),
      onCloseClick: vi.fn(),
      deckDef: (deckDefFixture as unknown) as DeckDefinition,
      mostRecentAnalysis: ({
        commands: [],
        labware: [],
      } as unknown) as CompletedProtocolAnalysis,
      initialLoadedLabwareByAdapter: {},
      attachedProtocolModuleMatches: [],
    }

    render(props)
    screen.getByText('Map View')
    screen.getByText('mock base deck')
    fireEvent.click(screen.getByLabelText('closeIcon'))
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('should render a deck with modules and labware', () => {
    const mockLabwareOnDeck = [
      {
        labwareLocation: { slotName: 'C1' },
        definition: fixtureTiprack300ul as LabwareDefinition2,
        topLabwareId: '300_ul_tiprack_id',
        onLabwareClick: expect.any(Function),
        labwareChildren: null,
      },
    ]
    const mockModulesOnDeck = [
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
    when(vi.mocked(BaseDeck))
      .calledWith({
        robotType: FLEX_ROBOT_TYPE,
        deckLayerBlocklist: getStandardDeckViewLayerBlockList(FLEX_ROBOT_TYPE),
        deckConfig: EXTENDED_DECK_CONFIG_FIXTURE,
        labwareOnDeck: mockLabwareOnDeck,
        modulesOnDeck: mockModulesOnDeck,
      })
      .thenReturn(<div>mock base deck</div>)
    vi.mocked(getLabwareRenderInfo).mockReturnValue({
      '300_ul_tiprack_id': {
        labwareDef: fixtureTiprack300ul as LabwareDefinition2,
        displayName: 'fresh tips',
        x: MOCK_300_UL_TIPRACK_COORDS[0],
        y: MOCK_300_UL_TIPRACK_COORDS[1],
        z: MOCK_300_UL_TIPRACK_COORDS[2],
        slotName: 'C1',
      },
    })
    render({
      handleLabwareClick: vi.fn(),
      onCloseClick: vi.fn(),
      deckDef: (deckDefFixture as unknown) as DeckDefinition,
      mostRecentAnalysis: ({} as unknown) as CompletedProtocolAnalysis,
      initialLoadedLabwareByAdapter: {},
      attachedProtocolModuleMatches: [
        {
          ...mockProtocolModuleInfo[0],
        },
      ],
    })
    expect(vi.mocked(BaseDeck)).toHaveBeenCalled()
  })
})
