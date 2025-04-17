import { describe, it, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { selectors } from '../../../../labware-ingred/selectors'
import { getCustomLabwareDefsByURI } from '../../../../labware-defs/selectors'
import { renderWithProviders } from '../../../../__testing-utils__'
import { getSelectedTerminalItemId } from '../../../../ui/steps'
import { OffDeckDetails } from '../OffDeckDetails'
import { OffDeck } from '..'
import type * as Components from '@opentrons/components'

vi.mock('../OffDeckDetails')
vi.mock('../../../../ui/steps')
vi.mock('../../../../labware-ingred/selectors')
vi.mock('../../../../labware-defs/selectors')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof Components>()
  return {
    ...actual,
    LabwareRender: () => <div>mock LabwareRender</div>,
  }
})

const render = () => {
  return renderWithProviders(<OffDeck />)
}

describe('OffDeck', () => {
  beforeEach(() => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedLabwareDefUri: null,
      selectedNestedLabwareDefUri: null,
      selectedFixture: null,
      selectedModuleModel: null,
      selectedSlot: { slot: null, cutout: null },
    })
    vi.mocked(getCustomLabwareDefsByURI).mockReturnValue({})
    vi.mocked(getSelectedTerminalItemId).mockReturnValue('__initial_setup__')
  })
  it('renders off deck details', () => {
    vi.mocked(OffDeckDetails).mockReturnValue(<div>mock off deck details</div>)
    render()
    screen.getByText('mock off deck details')
  })
})
