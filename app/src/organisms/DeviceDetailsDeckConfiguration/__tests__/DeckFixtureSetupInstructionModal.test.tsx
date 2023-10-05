import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'

import { DeckFixtureSetupInstructionModal } from '../DeckFixtureSetupInstructionModal'

const mockFunc = jest.fn()
const PNG_FILE_NAME = 'deck_fixture_setup.png'

const render = (
  props: React.ComponentProps<typeof DeckFixtureSetupInstructionModal>
) => {
  return renderWithProviders(<DeckFixtureSetupInstructionModal {...props} />, {
    i18nInstance: i18n,
  })
}
describe('DeckFixtureSetupInstructionModal', () => {
  let props: React.ComponentProps<typeof DeckFixtureSetupInstructionModal>

  beforeEach(() => {
    props = {
      setShowSetupInstructionsModal: mockFunc,
    }
  })

  it('should render text and image', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Deck fixture setup instructions')
    getByText(
      "First, unscrew and remove the deck slot where you'll install a fixture. Then put the fixture in place and attach it as needed."
    )
    getByText(
      'For detailed instructions for different types of fixtures, scan the QR code or go to the link below.'
    )
    const img = getByRole('img')
    expect(img.getAttribute('src')).toEqual(PNG_FILE_NAME)
    getByText('www.opentrons.com/support/fixtures')
  })

  it('should call a mock function when tapping the close icon', () => {
    const [{ getByLabelText }] = render(props)
    getByLabelText('closeIcon').click()
    expect(mockFunc).toHaveBeenCalled()
  })
})
