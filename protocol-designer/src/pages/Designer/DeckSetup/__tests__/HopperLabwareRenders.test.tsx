import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'

import {
  CenterLabwareInModuleChildSlot,
  STACKER_HOPPER_LABWARE_X_OFFSET,
} from '@opentrons/components'
import {
  fixture24Tuberack,
  fixtureTiprackAdapter,
  FLEX_STACKER_MODULE_V1,
  getModuleDef,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { START_TERMINAL_ITEM_ID } from '/protocol-designer/steplist'

import { HighlightLabware } from '../../HighlightLabware'
import { HopperLabwareRenders } from '../HopperLabwareRenders'
import { ModuleChildLabware } from '../ModuleChildLabware'
import { LabwareControls } from '../Overlays'
import { ActiveLabwareControls } from '../Overlays/ActiveLabwareControls'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { LabwareOnDeck } from '/protocol-designer/step-forms'

vi.mock('../../HighlightLabware')
vi.mock('../ModuleChildLabware')
vi.mock('../Overlays')
vi.mock('../Overlays/ActiveLabwareControls')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof CenterLabwareInModuleChildSlot>()
  return {
    ...actual,
    CenterLabwareInModuleChildSlot: vi.fn(),
  }
})

const primaryLabware: LabwareOnDeck = {
  id: 'primaryId',
  def: fixture24Tuberack as LabwareDefinition2,
  labwareDefURI: 'fixture/fixture_24_tuberack/1',
  stack: ['primaryId', 'hopper', 'moduleId', 'D3'],
  pythonName: 'labware_1',
}

const adapterLabware: LabwareOnDeck = {
  id: 'adapterId',
  def: fixtureTiprackAdapter as LabwareDefinition2,
  labwareDefURI: 'fixture/fixture_tiprack_adapter/1',
  stack: ['adapterId', 'hopper', 'moduleId', 'D3'],
  pythonName: 'adapter_1',
}

const lidLabware: LabwareOnDeck = {
  id: 'lidId',
  def: {
    ...(fixture24Tuberack as LabwareDefinition2),
    metadata: {
      ...(fixture24Tuberack as LabwareDefinition2).metadata,
      displayName: 'Mock Lid',
    },
  },
  labwareDefURI: 'fixture/fixture_lid/1',
  stack: ['lidId', 'primaryId', 'hopper', 'moduleId', 'D3'],
  pythonName: 'lid_1',
}

const render = (props: ComponentProps<typeof HopperLabwareRenders>) => {
  return renderWithProviders(<HopperLabwareRenders {...props} />)[0]
}

describe('HopperLabwareRenders', () => {
  let props: ComponentProps<typeof HopperLabwareRenders>

  beforeEach(() => {
    props = {
      labwaresOnDeck: {
        [primaryLabware.id]: primaryLabware,
      },
      slot: 'D3',
      topLabwareGroup: {
        primaryLabwareId: primaryLabware.id,
        adapterLabwareId: null,
        lidLabwareId: null,
      },
      allModules: [],
      terminalItemId: START_TERMINAL_ITEM_ID,
      setHover: vi.fn(),
      setShowMenuListForId: vi.fn(),
      hover: null,
      setHoveredLabware: vi.fn(),
      moduleDefinition: getModuleDef(FLEX_STACKER_MODULE_V1),
      deckId: 'ot3_standard',
      slotId: 'D3',
    }
    vi.mocked(CenterLabwareInModuleChildSlot).mockImplementation(
      ({ children }) => <div>mock CenterLabwareInModuleChildSlot{children}</div>
    )
    vi.mocked(ModuleChildLabware).mockImplementation(
      ({ labwareOnDeck, xOffset }) => (
        <div>{`mock ModuleChildLabware ${labwareOnDeck.id} xOffset=${xOffset}`}</div>
      )
    )
    vi.mocked(HighlightLabware).mockReturnValue(
      <div>mock HighlightLabware</div>
    )
    vi.mocked(LabwareControls).mockReturnValue(<div>mock LabwareControls</div>)
    vi.mocked(ActiveLabwareControls).mockReturnValue(
      <div>mock ActiveLabwareControls</div>
    )
  })

  it('returns null when the primary hopper labware is missing', () => {
    const { container } = render({
      ...props,
      labwaresOnDeck: {},
    })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders primary hopper labware with the stacker hopper x offset', () => {
    render(props)

    screen.getByText(
      `mock ModuleChildLabware ${primaryLabware.id} xOffset=${STACKER_HOPPER_LABWARE_X_OFFSET}`
    )
  })

  it('renders adapter and lid when present in the hopper group', () => {
    render({
      ...props,
      labwaresOnDeck: {
        [primaryLabware.id]: primaryLabware,
        [adapterLabware.id]: adapterLabware,
        [lidLabware.id]: lidLabware,
      },
      topLabwareGroup: {
        primaryLabwareId: primaryLabware.id,
        adapterLabwareId: adapterLabware.id,
        lidLabwareId: lidLabware.id,
      },
    })

    screen.getByText(
      `mock ModuleChildLabware ${adapterLabware.id} xOffset=${STACKER_HOPPER_LABWARE_X_OFFSET}`
    )
    screen.getByText(
      `mock ModuleChildLabware ${primaryLabware.id} xOffset=${STACKER_HOPPER_LABWARE_X_OFFSET}`
    )
    screen.getByText(
      `mock ModuleChildLabware ${lidLabware.id} xOffset=${STACKER_HOPPER_LABWARE_X_OFFSET}`
    )
  })

  it('centers hopper controls', () => {
    render(props)

    screen.getByText('mock CenterLabwareInModuleChildSlot')
    screen.getByText('mock HighlightLabware')
    screen.getByText('mock LabwareControls')
    screen.getByText('mock ActiveLabwareControls')
  })
})
