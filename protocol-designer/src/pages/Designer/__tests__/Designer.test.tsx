import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { LiquidsOverflowMenu } from '../../../components/organisms/LiquidsOverflowMenu'
import { getFileMetadata } from '../../../file-data/selectors'
import { generateNewProtocol } from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { Designer } from '../index'
import { ProtocolSteps } from '../ProtocolSteps'

import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('../OffDeck')
vi.mock('../ProtocolSteps')
vi.mock('../../../labware-ingred/actions')
vi.mock('../../../labware-ingred/selectors')
vi.mock('../../../components/organisms/LiquidsOverflowMenu')
vi.mock('../DeckSetup')
vi.mock('../../../file-data/selectors')
vi.mock('../../../top-selectors/labware-locations')
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <Designer />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('Designer', () => {
  beforeEach(() => {
    vi.mocked(ProtocolSteps).mockReturnValue(<div>mock ProtocolSteps</div>)
    vi.mocked(getFileMetadata).mockReturnValue({
      protocolName: 'mockProtocolName',
      created: 123,
    })
    vi.mocked(selectors.getIsNewProtocol).mockReturnValue(true)
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      modules: {},
      additionalEquipmentOnDeck: {
        trash: { name: 'trashBin', location: 'cutoutA3', id: 'mockId' },
      },
      labware: {},
      pipettes: {},
    })
    vi.mocked(LiquidsOverflowMenu).mockReturnValue(
      <div>mock LiquidsOverflowMenu</div>
    )
    vi.mocked(selectors.getZoomedInSlot).mockReturnValue({
      slot: null,
      cutout: null,
    })
  })

  it('renders deck setup container', () => {
    render()
    screen.getByText('mock ProtocolSteps')
  })

  it('calls generateNewProtocol when hardware has been placed for a new protocol', () => {
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      modules: {},
      additionalEquipmentOnDeck: {
        wasteChute: { name: 'wasteChute', id: 'mockId', location: 'cutoutD3' },
        trashBin: { name: 'trashBin', id: 'mockId', location: 'cutoutA3' },
      },
      labware: {},
      pipettes: {},
    })
    render()
    expect(vi.mocked(generateNewProtocol)).toHaveBeenCalled()
  })
})
