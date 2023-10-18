import * as React from 'react'
import i18n from 'i18next'
import { DeckConfigurator, renderWithProviders } from '@opentrons/components'
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
    const { getByText, getByRole } = render(props)
    getByText('mock deck config')
    getByText('Staging Areas')
    getByRole('button', { name: 'cancel' }).click()
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
