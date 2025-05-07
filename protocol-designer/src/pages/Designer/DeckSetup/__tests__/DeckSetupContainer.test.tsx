import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'

import { FlexTrash } from '@opentrons/components'
import {
  deckExample,
  FLEX_ROBOT_TYPE,
  getPositionFromSlotId,
} from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
import { getDisableModuleRestrictions } from '../../../../feature-flags/selectors'
import { getRobotType } from '../../../../file-data/selectors'
import { selectors } from '../../../../labware-ingred/selectors'
import { START_TERMINAL_ITEM_ID } from '../../../../steplist'
import { getDeckSetupForActiveItem } from '../../../../top-selectors/labware-locations'
import { getSelectedTerminalItemId } from '../../../../ui/steps'
import {
  getHoveredDropdownItem,
  getSelectedDropdownItem,
} from '../../../../ui/steps/selectors'
import { DeckSetupContainer } from '../DeckSetupContainer'
import { DeckSetupDetails } from '../DeckSetupDetails'
import { DeckSetupToolbox } from '../DeckSetupToolbox'
import { getCutoutIdForAddressableArea } from '../utils'

import type * as OpentronsComponents from '@opentrons/components'
import type * as OpentronsShared from '@opentrons/shared-data'

vi.mock('../../../../ui/steps/selectors')
vi.mock('../../../../top-selectors/labware-locations')
vi.mock('../../../../feature-flags/selectors')
vi.mock('../DeckSetupToolbox')
vi.mock('../DeckSetupDetails')
vi.mock('../../../../ui/steps')
vi.mock('../../../../labware-ingred/selectors')
vi.mock('../../../../file-data/selectors')
vi.mock('../utils')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    FlexTrash: vi.fn(),
    SingleSlotFixture: <div>mock singleSlotFixture</div>,
  }
})
vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsShared>()
  return {
    ...actual,
    getPositionFromSlotId: vi.fn(),
  }
})

const render = () => {
  return renderWithProviders(
    <DeckSetupContainer
      setHoverSlot={vi.fn()}
      hoverSlot={null}
      robotType={FLEX_ROBOT_TYPE}
      deckDef={
        ({
          ...deckExample,
          locations: { addressableAreas: [{ id: 'cutoutD3' }] },
        } as any) as OpentronsShared.DeckDefinition
      }
      setViewBox={vi.fn()}
      viewBox="mockViewBox"
      initialViewBox="mockInitialViewBox"
    />
  )[0]
}

describe('DeckSetupContainer', () => {
  beforeEach(() => {
    vi.mocked(selectors.getZoomedInSlot).mockReturnValue({
      slot: 'D3',
      cutout: 'cutoutD3',
    })
    vi.mocked(getSelectedDropdownItem).mockReturnValue([
      { id: null, text: null },
    ])
    vi.mocked(getHoveredDropdownItem).mockReturnValue({ id: null, text: null })
    vi.mocked(DeckSetupToolbox).mockReturnValue(
      <div>mock DeckSetupToolbox</div>
    )
    vi.mocked(DeckSetupDetails).mockReturnValue(
      <div>mock DeckSetupDetails</div>
    )
    vi.mocked(FlexTrash).mockReturnValue(<div>mock FlexTrash</div>)
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(getDisableModuleRestrictions).mockReturnValue(false)
    vi.mocked(getSelectedTerminalItemId).mockReturnValue(START_TERMINAL_ITEM_ID)
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      labware: {},
      modules: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
    })
    vi.mocked(getCutoutIdForAddressableArea).mockReturnValue('cutoutD3')
    vi.mocked(getPositionFromSlotId).mockReturnValue([0, 0, 0])
  })
  it('renders the DeckSetupToolbox when slot and cutout are not null', () => {
    render()
    screen.getByText('mock DeckSetupDetails')
    screen.getByText('mock DeckSetupToolbox')
  })
  it('renders no DeckSetupToolbox when slot and cutout are null', () => {
    vi.mocked(selectors.getZoomedInSlot).mockReturnValue({
      slot: null,
      cutout: null,
    })
    render()
    screen.getByText('mock DeckSetupDetails')
  })
  it('does not render a flex trash if the zoomed in slot cutout is the same location', () => {
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      labware: {},
      modules: {},
      additionalEquipmentOnDeck: {
        trash: { name: 'trashBin', location: 'cutoutD3', id: 'mockId' },
      },
      pipettes: {},
    })
    render()
    expect(screen.queryByText('mock FlexTrash')).not.toBeInTheDocument()
  })
})
