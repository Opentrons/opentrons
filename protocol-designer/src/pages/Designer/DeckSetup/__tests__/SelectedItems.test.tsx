import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'

import { Module } from '@opentrons/components'
import {
  fixture24Tuberack,
  fixtureTiprackAdapter,
  FLEX_ROBOT_TYPE,
  getAllLabwareDefs,
  getDeckDefFromRobotType,
  HEATERSHAKER_MODULE_V1,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { getCustomLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'
import { START_TERMINAL_ITEM_ID } from '/protocol-designer/steplist'
import { getSelectedTerminalItemId } from '/protocol-designer/ui/steps'

import { FixtureRender } from '../FixtureRender'
import { SelectedItems } from '../SelectedItems'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('../FixtureRender')
vi.mock('/protocol-designer/labware-ingred/selectors')
vi.mock('/protocol-designer/labware-defs/selectors')
vi.mock('/protocol-designer/components/organisms')
vi.mock('/protocol-designer/file-data/selectors')
vi.mock('/protocol-designer/ui/steps')

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof Module>()
  return {
    ...actual,
    Module: vi.fn(),
  }
})
vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof getAllLabwareDefs>()
  return {
    ...actual,
    getAllLabwareDefs: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof SelectedItems>) => {
  return renderWithProviders(<SelectedItems {...props} />)[0]
}

const mockAdapterURI = 'fixture/fixture_universal_flat_bottom_adapter/1'
describe('SelectedItems', () => {
  let props: ComponentProps<typeof SelectedItems>

  beforeEach(() => {
    props = {
      deckDef: getDeckDefFromRobotType(FLEX_ROBOT_TYPE),
      robotType: FLEX_ROBOT_TYPE,
      slotPosition: [0, 0, 0],
    }
    vi.mocked(getSelectedTerminalItemId).mockReturnValue(START_TERMINAL_ITEM_ID)
    vi.mocked(getAllLabwareDefs).mockReturnValue({
      [mockAdapterURI]: {
        ...fixture24Tuberack,
        metadata: {
          displayName: 'Fixture Opentrons Universal Flat Heater-Shaker Adapter',
        },
      } as any,
    })
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
      labware: {
        labware: {
          id: 'mockId',
          def: fixture24Tuberack as LabwareDefinition2,
          labwareDefURI: mockAdapterURI,
          stack: ['mockId', 'D3'],
          pythonName: 'mockPythonName',
        },
      },
    })
    vi.mocked(LabwareOnDeck).mockReturnValue(<div>mock LabwareOnDeck</div>)
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedAdapterDefURI: null,
      selectedTopLabware: { labwareDefURI: null, amount: 1 },
      selectedLidLabware: null,
      selectedFixture: 'trashBin',
      selectedModuleModel: null,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    vi.mocked(getCustomLabwareDefsByURI).mockReturnValue({})
    vi.mocked(FixtureRender).mockReturnValue(<div>mock FixtureRender</div>)
    vi.mocked(Module).mockReturnValue(<div>mock Module</div>)
  })
  it('renders a selected fixture by itself', () => {
    render(props)
    screen.getByText('mock FixtureRender')
    expect(screen.queryByText('mock Module')).not.toBeInTheDocument()
  })
  it('renders a selected fixture with a selected labware', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedAdapterDefURI: mockAdapterURI,
      selectedTopLabware: { labwareDefURI: null, amount: 1 },
      selectedLidLabware: null,
      selectedFixture: 'trashBin',
      selectedModuleModel: null,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    render(props)
    screen.getByText('mock FixtureRender')
    expect(screen.queryByText('mock Module')).not.toBeInTheDocument()
  })
  it('renders a selected module', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedAdapterDefURI: null,
      selectedTopLabware: { labwareDefURI: null, amount: 1 },
      selectedLidLabware: null,
      selectedFixture: null,
      selectedModuleModel: HEATERSHAKER_MODULE_V1,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    render(props)
    screen.getByText('mock Module')
    expect(screen.queryByText('mock FixtureRender')).not.toBeInTheDocument()
    screen.getByText('Heater-Shaker Module GEN1')
  })
  it('renders a selected module and a selected labware', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedAdapterDefURI: mockAdapterURI,
      selectedTopLabware: { labwareDefURI: null, amount: 1 },
      selectedLidLabware: null,
      selectedFixture: null,
      selectedModuleModel: HEATERSHAKER_MODULE_V1,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    render(props)
    screen.getByText('mock Module')
    expect(screen.queryByText('mock FixtureRender')).not.toBeInTheDocument()
    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Fixture Opentrons Universal Flat Heater-Shaker Adapter')
  })
  it('renders selected fixture and both labware and nested labware', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
      labware: {
        labware: {
          id: 'mockId',
          def: fixtureTiprackAdapter as LabwareDefinition2,
          labwareDefURI: mockAdapterURI,
          stack: ['mockId', 'D3'],
          pythonName: 'mockPythonName',
        },
        labware2: {
          id: 'mockId2',
          def: fixture24Tuberack as LabwareDefinition2,
          labwareDefURI: mockAdapterURI,
          stack: ['mockId2', 'mockId', 'D3'],
          pythonName: 'mockPythonName',
        },
      },
    })
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedAdapterDefURI: mockAdapterURI,
      selectedTopLabware: { labwareDefURI: mockAdapterURI, amount: 1 },
      selectedLidLabware: null,
      selectedFixture: 'trashBin',
      selectedModuleModel: null,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    render(props)
    screen.getByText('mock FixtureRender')
    screen.getByText('mock LabwareOnDeck')
    expect(
      screen.getAllByText(
        'Fixture Opentrons Universal Flat Heater-Shaker Adapter'
      )
    ).toHaveLength(2)
  })
})
