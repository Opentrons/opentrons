import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SetupInstructionsModal } from '../SetupInstructionsModal'

import type { ComponentProps } from 'react'

const mockSetShowSetupInstructionsModal = vi.fn()
const QR_CODE_IMAGE_FILE =
  '/app/src/assets/images/on-device-display/setup_instructions_qr_code.png'

const render = (props: ComponentProps<typeof SetupInstructionsModal>) => {
  return renderWithProviders(<SetupInstructionsModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupInstructionsModal', () => {
  let props: ComponentProps<typeof SetupInstructionsModal>

  beforeEach(() => {
    props = {
      setShowSetupInstructionsModal: mockSetShowSetupInstructionsModal,
    }
  })

  it('should render text and image', () => {
    render(props)
    screen.getByText('Setup instructions')
    screen.getByText(
      'Follow the step-by-step setup instructions in the module’s manual. Scan the QR code or click the link below to view it on the Opentrons documentation website.'
    )
    screen.getByText('https://docs.opentrons.com/modules')
    expect(screen.getByRole('img').getAttribute('src')).toEqual(
      QR_CODE_IMAGE_FILE
    )
  })

  it('should call mock function when tapping close icon', () => {
    render(props)
    fireEvent.click(screen.getByLabelText('closeIcon'))
    expect(mockSetShowSetupInstructionsModal).toHaveBeenCalled()
  })
})
