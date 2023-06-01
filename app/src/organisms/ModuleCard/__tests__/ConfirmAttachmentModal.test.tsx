import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { ConfirmAttachmentModal } from '../ConfirmAttachmentModal'

const render = (props: React.ComponentProps<typeof ConfirmAttachmentModal>) => {
  return renderWithProviders(<ConfirmAttachmentModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConfirmAttachmentBanner', () => {
  let props: React.ComponentProps<typeof ConfirmAttachmentModal>

  beforeEach(() => {
    props = {
      onConfirmClick: jest.fn(),
      isProceedToRunModal: false,
      onCloseClick: jest.fn(),
    }
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the correct modal info when accessed through set shake slideout', () => {
    const { getByText, getByRole } = render(props)
    getByText('Confirm Heater-Shaker Module attachment')
    getByText(
      'Module should have both anchors fully extended for a firm attachment to the deck.'
    )
    getByText('The thermal adapter should be attached to the module.')
    getByText('Don’t show me again')
    getByText('cancel')
    getByText('Confirm attachment')
    const confirmBtn = getByRole('button', { name: 'Confirm attachment' })
    fireEvent.click(confirmBtn)
    expect(props.onConfirmClick).toHaveBeenCalled()
    const cancelbtn = getByRole('button', { name: 'cancel' })
    fireEvent.click(cancelbtn)
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('renders the correct modal info when accessed through proceed to run CTA and clicks proceed to run button', () => {
    props = {
      onCloseClick: jest.fn(),
      isProceedToRunModal: true,
      onConfirmClick: jest.fn(),
    }

    const { getByText, getByRole } = render(props)

    getByText(
      'Before the run begins, module should have both anchors fully extended for a firm attachment to the deck.'
    )
    getByText('The thermal adapter should be attached to the module.')
    const btn = getByRole('button', { name: 'Proceed to run' })
    fireEvent.click(btn)
    expect(props.onConfirmClick).toHaveBeenCalled()
    const cancelbtn = getByRole('button', { name: 'cancel' })
    fireEvent.click(cancelbtn)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
