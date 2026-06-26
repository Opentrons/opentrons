import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { BaseDeck, EXTENDED_DECK_CONFIG_FIXTURE } from '@opentrons/components'
import { fixtureTiprack300ul, FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { getStandardDeckViewLayerBlockList } from '/app/local-resources/deck_configuration'

import { mockProtocolModuleInfo } from '../__fixtures__'
import { LabwareMapView } from '../LabwareMapView'

import type { ComponentProps } from 'react'
import type {
  CompletedProtocolAnalysis,
  getSimplestDeckConfigForProtocol,
  LabwareDefinition,
  ModuleModel,
} from '@opentrons/shared-data'

vi.mock('/app/transformations/analysis')
vi.mock('@opentrons/components/src/hardware-sim/Labware/LabwareRender')
vi.mock('@opentrons/components/src/hardware-sim/BaseDeck')
vi.mock('@opentrons/shared-data/js/helpers/getSimplestFlexDeckConfig')
vi.mock('/app/resources/deck_configuration/utils')
vi.mock('/app/redux/config')

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

const render = (props: ComponentProps<typeof LabwareMapView>) => {
  return renderWithProviders(
    <MemoryRouter>
      <LabwareMapView {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('LabwareMapView', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render a deck with modules and labware', () => {
    const mockLabwareOnDeck = [
      {
        labwareLocation: { slotName: 'C1' },
        definition: fixtureTiprack300ul as LabwareDefinition,
        topLabwareId: '300_ul_tiprack_id',
        onLabwareClick: expect.any(Function),
        labwareChildren: null,
      },
    ]
    const mockModulesOnDeck = [
      {
        moduleModel: 'heaterShakerModuleV1' as ModuleModel,
        moduleLocation: { slotName: 'B1' },
        nestedLabwareDefsBottomToTop: [
          mockProtocolModuleInfo[0].nestedLabwareDef,
        ] as LabwareDefinition[],
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
    render({
      handleLabwareClick: vi.fn(),
      mostRecentAnalysis: {} as unknown as CompletedProtocolAnalysis,
      startingDeck: {
        A1: [
          [
            {
              displayName: 'nickName',
              definitionUri: 'mock def uri',
              labwareId: '1234',
            },
          ],
        ],
      },
      labwareByLiquidId: {},
    })
    expect(vi.mocked(BaseDeck)).toHaveBeenCalled()
  })
})
