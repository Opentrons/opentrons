import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'

import { DeckFixtureSetupInstructionsModal } from '../DeckFixtureSetupInstructionsModal'
import { fireEvent } from '@testing-library/react'

const mockFunc = jest.fn()
const PNG_FILE_NAME = 'deck_fixture_setup_qrcode.png'

const render = (
  props: React.ComponentProps<typeof DeckFixtureSetupInstructionsModal>
) => {
  return renderWithProviders(<DeckFixtureSetupInstructionsModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Touchscreen DeckFixtureSetupInstructionsModal', () => {
  let props: React.ComponentProps<typeof DeckFixtureSetupInstructionsModal>

  beforeEach(() => {
    props = {
      setShowSetupInstructionsModal: mockFunc,
      isOnDevice: true,
    }
  })

  it('should render text and image', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Deck fixture setup instructions')
    getByText(
      "First, unscrew and remove the deck slot where you'll install a fixture. Then put the fixture in place and attach it as needed."
    )
    getByText(
      'For details on installing different fixture types, scan the QR code or search for “deck configuration” on support.opentrons.com'
    )
    const img = getByRole('img')
    expect(img.getAttribute('src')).toEqual(PNG_FILE_NAME)
  })

  it('should call a mock function when tapping the close icon', () => {
    const [{ getByLabelText }] = render(props)
    fireEvent.click(getByLabelText('closeIcon'))
    expect(mockFunc).toHaveBeenCalled()
  })
})

describe('Desktop DeckFixtureSetupInstructionsModal', () => {
  let props: React.ComponentProps<typeof DeckFixtureSetupInstructionsModal>

  beforeEach(() => {
    props = {
      setShowSetupInstructionsModal: mockFunc,
    }
  })

  it('should render text, image, and button', () => {
    const [{ getAllByText, getByText, getByRole, queryByText }] = render(props)
    expect(getAllByText('Deck fixture setup instructions').length).toBe(2)
    getByText(
      "First, unscrew and remove the deck slot where you'll install a fixture. Then put the fixture in place and attach it as needed."
    )
    getByText(
      'For detailed instructions for different types of fixtures, scan the QR code or go to the link below.'
    )
    const img = getByRole('img')
    expect(img.getAttribute('src')).toEqual(PNG_FILE_NAME)
    expect(
      queryByText('www.opentrons.com/support/fixtures')
    ).not.toBeInTheDocument()
    getByRole('button', { name: 'Close' })
  })
})
