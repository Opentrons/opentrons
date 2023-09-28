import * as React from 'react'
import i18n from 'i18next'
import { waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { getSlotIsEmpty } from '../../../step-forms'
import { createContainer } from '../../../labware-ingred/actions'
import { FLEX_TRASH_DEF_URI } from '../../../constants'
import { TrashBinModal } from '../TrashBinModal'

jest.mock('../../../step-forms')
jest.mock('../../../step-forms/selectors')
jest.mock('../../../labware-ingred/actions')

const mockGetInitialDeckSetup = getInitialDeckSetup as jest.MockedFunction<
  typeof getInitialDeckSetup
>
const mockGetSlotIsEmpty = getSlotIsEmpty as jest.MockedFunction<
  typeof getSlotIsEmpty
>
const mockCreateContainer = createContainer as jest.MockedFunction<
  typeof createContainer
>
const render = (props: React.ComponentProps<typeof TrashBinModal>) => {
  return renderWithProviders(<TrashBinModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TrashBinModal', () => {
  let props: React.ComponentProps<typeof TrashBinModal>
  beforeEach(() => {
    props = {
      onCloseClick: jest.fn(),
    }
    mockGetInitialDeckSetup.mockReturnValue({
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {},
      modules: {},
    })
    mockGetSlotIsEmpty.mockReturnValue(true)
  })
  it('renders buttons, position and slot dropdown', async () => {
    const { getByRole, getByText } = render(props)
    getByText('Trash Bin')
    getByText('Position')
    getByText('Slot A1')
    getByText('Slot A3')
    getByText('Slot B1')
    getByText('Slot B3')
    getByText('Slot C1')
    getByText('Slot C3')
    getByText('Slot D1')
    getByText('Slot D3')
    getByRole('button', { name: 'cancel' }).click()
    expect(props.onCloseClick).toHaveBeenCalled()
    getByRole('button', { name: 'save' }).click()
    await waitFor(() => {
      expect(mockCreateContainer).toHaveBeenCalledWith({
        labwareDefURI: FLEX_TRASH_DEF_URI,
        slot: 'A3',
      })
    })
  })
  it('renders the button as disabled when the slot is full', () => {
    mockGetSlotIsEmpty.mockReturnValue(false)
    const { getByRole } = render(props)
    expect(getByRole('button', { name: 'save' })).toBeDisabled()
  })
})
