import { describe, it, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { LabwareRender } from '@opentrons/components'
import { selectors } from '../../../../labware-ingred/selectors'
import { getCustomLabwareDefsByURI } from '../../../../labware-defs/selectors'
import { HoveredItem } from '../HoveredItem'

import type { ComponentProps } from 'react'
import type * as OpentronsComponents from '@opentrons/components'

vi.mock('../../../../labware-ingred/selectors')
vi.mock('../../../../labware-defs/selectors')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    LabwareRender: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof HoveredItem>) => {
  return renderWithProviders(<HoveredItem {...props} />)[0]
}

describe('HoveredItem', () => {
  let props: ComponentProps<typeof HoveredItem>

  beforeEach(() => {
    props = {
      hoveredSlotPosition: [0, 0, 0],
      hoveredLabware: null,
    }
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedLabwareDefUri: null,
      selectedNestedLabwareDefUri: null,
      selectedFixture: null,
      selectedModuleModel: null,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    vi.mocked(getCustomLabwareDefsByURI).mockReturnValue({})
    vi.mocked(LabwareRender).mockReturnValue(<div>mock LabwareRender</div>)
  })
  it('renders a hovered labware', () => {
    props.hoveredLabware = 'fixture/fixture_universal_flat_bottom_adapter/1'
    render(props)
    screen.getByText('mock LabwareRender')
    screen.getByText('Fixture Opentrons Universal Flat Heater-Shaker Adapter')
  })
})
