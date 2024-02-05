import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { DeckConfigurator } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../localization'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { getSlotIsEmpty } from '../../../step-forms'
import { StagingAreasModal } from '../StagingAreasModal'

jest.mock('../../../step-forms')
jest.mock('../../../step-forms/selectors')
jest.mock('../../../step-forms/actions/additionalItems')
jest.mock('@opentrons/components/src/hardware-sim/DeckConfigurator/index')

const mockGetInitialDeckSetup = getInitialDeckSetup as jest.MockedFunction<
  typeof getInitialDeckSetup
>
const mockGetSlotIsEmpty = getSlotIsEmpty as jest.MockedFunction<
  typeof getSlotIsEmpty
>
const mockDeckConfigurator = DeckConfigurator as jest.MockedFunction<
  typeof DeckConfigurator
>
const render = (props: React.ComponentProps<typeof StagingAreasModal>) => {
  return renderWithProviders(<StagingAreasModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StagingAreasModal', () => {
  let props: React.ComponentProps<typeof StagingAreasModal>
  beforeEach(() => {
    props = {
      onCloseClick: jest.fn(),
      stagingAreas: [],
    }
    mockGetInitialDeckSetup.mockReturnValue({
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {},
      modules: {},
    })
    mockGetSlotIsEmpty.mockReturnValue(true)
    mockDeckConfigurator.mockReturnValue(<div>mock deck config</div>)
  })
  it('renders the deck, header, and buttons work as expected', () => {
    render(props)
    screen.getByText('mock deck config')
    screen.getByText('Staging Area Slots')
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
