import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'

import { SetupInstructionsModal } from '../SetupInstructionsModal'

const mockSetShowSetupInstructionsModal = jest.fn()
const QR_CODE_IMAGE_FILE = 'setup_instructions_qr_code.png'

const render = (props: React.ComponentProps<typeof SetupInstructionsModal>) => {
  return renderWithProviders(<SetupInstructionsModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupInstructionsModal', () => {
  let props: React.ComponentProps<typeof SetupInstructionsModal>

  beforeEach(() => {
    props = {
      setShowSetupInstructionsModal: mockSetShowSetupInstructionsModal,
    }
  })

  it('should render text and image', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Setup instructions')
    getByText(
      'For step-by-step instructions on setting up your module, consult the Quickstart Guide that came in its box or scan the QR code to visit the modules section of the Opentrons Help Center.'
    )
    getByText('support.opentrons.com/s/modules')
    expect(getByRole('img').getAttribute('src')).toEqual(QR_CODE_IMAGE_FILE)
  })

  it('should call mock function when tapping close icon', () => {
    const [{ getByLabelText }] = render(props)
    getByLabelText('closeIcon').click()
    expect(mockSetShowSetupInstructionsModal).toHaveBeenCalled()
  })
})
