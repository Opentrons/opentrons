import type * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import {
  FLEX_ROBOT_TYPE,
  HEATERSHAKER_MODULE_V1,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'
import { LabwareRender, Module } from '@opentrons/components'
import { selectors } from '../../../../labware-ingred/selectors'
import { getCustomLabwareDefsByURI } from '../../../../labware-defs/selectors'
import { FixtureRender } from '../FixtureRender'
import { SelectedHoveredItems } from '../SelectedHoveredItems'
import type * as OpentronsComponents from '@opentrons/components'

vi.mock('../FixtureRender')
vi.mock('../../../../labware-ingred/selectors')
vi.mock('../../../../labware-defs/selectors')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    LabwareRender: vi.fn(),
    Module: vi.fn(),
  }
})

const render = (props: React.ComponentProps<typeof SelectedHoveredItems>) => {
  return renderWithProviders(<SelectedHoveredItems {...props} />)[0]
}

describe('SelectedHoveredItems', () => {
  let props: React.ComponentProps<typeof SelectedHoveredItems>

  beforeEach(() => {
    props = {
      deckDef: getDeckDefFromRobotType(FLEX_ROBOT_TYPE),
      robotType: FLEX_ROBOT_TYPE,
      hoveredLabware: null,
      hoveredModule: null,
      hoveredFixture: null,
      slotPosition: [0, 0, 0],
    }
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedLabwareDefUri: null,
      selectedNestedLabwareDefUri: null,
      selectedFixture: 'trashBin',
      selectedModuleModel: null,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    vi.mocked(getCustomLabwareDefsByURI).mockReturnValue({})
    vi.mocked(FixtureRender).mockReturnValue(<div>mock FixtureRender</div>)
    vi.mocked(LabwareRender).mockReturnValue(<div>mock LabwareRender</div>)
    vi.mocked(Module).mockReturnValue(<div>mock Module</div>)
  })
  it('renders a selected fixture by itself', () => {
    render(props)
    screen.getByText('mock FixtureRender')
    expect(screen.queryByText('mock Module')).not.toBeInTheDocument()
  })
  it('renders a selected fixture with a selected labware', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedLabwareDefUri: 'fixture/fixture_universal_flat_bottom_adapter/1',
      selectedNestedLabwareDefUri: null,
      selectedFixture: 'trashBin',
      selectedModuleModel: null,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    render(props)
    screen.getByText('mock FixtureRender')
    screen.getByText('mock LabwareRender')
    expect(screen.queryByText('mock Module')).not.toBeInTheDocument()
    screen.getByText('Fixture Opentrons Universal Flat Heater-Shaker Adapter')
  })
  it('renders a selected module', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedLabwareDefUri: null,
      selectedNestedLabwareDefUri: null,
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
      selectedLabwareDefUri: 'fixture/fixture_universal_flat_bottom_adapter/1',
      selectedNestedLabwareDefUri: null,
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
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedLabwareDefUri: 'fixture/fixture_universal_flat_bottom_adapter/1',
      selectedNestedLabwareDefUri:
        'fixture/fixture_universal_flat_bottom_adapter/1',
      selectedFixture: 'trashBin',
      selectedModuleModel: null,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    render(props)
    screen.getByText('mock FixtureRender')
    expect(screen.getAllByText('mock LabwareRender')).toHaveLength(2)
    expect(
      screen.getAllByText(
        'Fixture Opentrons Universal Flat Heater-Shaker Adapter'
      )
    ).toHaveLength(2)
  })
  it('renders nothing when there is a hovered module but selected fixture', () => {
    props.hoveredModule = HEATERSHAKER_MODULE_V1
    render(props)
    expect(screen.queryByText('mock FixtureRender')).not.toBeInTheDocument()
  })
})
