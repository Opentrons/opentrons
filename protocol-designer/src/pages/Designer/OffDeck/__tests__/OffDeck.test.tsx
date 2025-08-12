import { beforeEach, describe, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { LiquidButton } from '/protocol-designer/components/molecules'
import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { getCustomLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import { START_TERMINAL_ITEM_ID } from '/protocol-designer/steplist'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getSelectedTerminalItemId } from '/protocol-designer/ui/steps'

import { OffDeck } from '..'
import { DeckSetupToolbox } from '../../DeckSetup/DeckSetupToolbox'
import { OffDeckDetails } from '../OffDeckDetails'

import type { ComponentProps } from 'react'
import type * as Components from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../OffDeckDetails')
vi.mock('/protocol-designer/ui/steps')
vi.mock('/protocol-designer/labware-ingred/selectors')
vi.mock('/protocol-designer/labware-defs/selectors')
vi.mock('/protocol-designer/components/molecules')
vi.mock('/protocol-designer/top-selectors/labware-locations')
vi.mock('../../DeckSetup/DeckSetupToolbox')
vi.mock('/protocol-designer/components/organisms')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof Components>()
  return {
    ...actual,
    LabwareRender: () => <div>mock LabwareRender</div>,
  }
})

const render = (props: ComponentProps<typeof OffDeck>) => {
  return renderWithProviders(<OffDeck {...props} />)
}

describe('OffDeck', () => {
  let props: ComponentProps<typeof OffDeck>
  beforeEach(() => {
    props = {
      setOverflowMenu: vi.fn(),
    }
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      modules: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {},
    })
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedTopLabware: { labwareDefURI: null, amount: 1 },
      selectedLidLabware: null,
      selectedAdapterDefURI: null,
      selectedFixture: null,
      selectedModuleModel: null,
      selectedSlot: { slot: null, cutout: null },
    })
    vi.mocked(LiquidButton).mockReturnValue(<div>mock LiquidButton</div>)
    vi.mocked(getCustomLabwareDefsByURI).mockReturnValue({})
    vi.mocked(getSelectedTerminalItemId).mockReturnValue(START_TERMINAL_ITEM_ID)
    vi.mocked(DeckSetupToolbox).mockReturnValue(
      <div>mock DeckSetupToolbox</div>
    )
    vi.mocked(LabwareOnDeck).mockReturnValue(<div>mock LabwareOnDeck</div>)
  })
  it('renders off deck details', () => {
    vi.mocked(OffDeckDetails).mockReturnValue(<div>mock off deck details</div>)
    render(props)
    screen.getByText('mock off deck details')
  })
  it('renders the off deck "zoomedIn" view with no labware selected', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedTopLabware: { labwareDefURI: null, amount: 1 },
      selectedLidLabware: null,
      selectedAdapterDefURI: null,
      selectedFixture: null,
      selectedModuleModel: null,
      selectedSlot: { slot: 'offDeck', cutout: null },
    })
    render(props)
    screen.getByText('mock LiquidButton')
    screen.getByText('mock DeckSetupToolbox')
  })
  it('renders the off deck "zoomedIn" view with a labware selected', () => {
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      modules: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {
        lab: { id: 'lab', def: fixture96Plate as LabwareDefinition2 } as any,
      },
    })
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedTopLabware: { labwareDefURI: null, amount: 1 },
      selectedLidLabware: null,
      selectedAdapterDefURI: null,
      selectedFixture: null,
      selectedModuleModel: null,
      selectedSlot: { slot: 'lab', cutout: null },
    })
    render(props)
    screen.getByText('mock LabwareOnDeck')
    screen.getByText('ANSI 96 Standard Microplate')
  })
})
