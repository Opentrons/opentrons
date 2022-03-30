import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { ConfirmCancelModal } from '../../../organisms/RunDetails/ConfirmCancelModal'

const render = (props: React.ComponentProps<typeof ConfirmCancelModal>) => {
  return renderWithProviders(<ConfirmCancelModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConfirmCancelModal', () => {
  let props: React.ComponentProps<typeof ConfirmCancelModal>
  beforeEach(() => {
    props = { onClose: jest.fn(), runId: 'mockRunId' }
  })

  it('should render the correct title', () => {
    const { getByText } = render(props)
    getByText('Are you sure you want to cancel this run?')
  })
  it('should render the correct body', () => {
    const { getByText } = render(props)
    getByText(
      'Doing so will terminate this run, drop any attached tips in the trash container and home your robot.'
    )
    getByText(
      'Additionally, any hardware modules used within the protocol will remain active and maintain their current states until deactivated.'
    )
  })
  it('should render both buttons', () => {
    const { getByRole } = render(props)
    expect(props.onClose).not.toHaveBeenCalled()
    getByRole('button', { name: 'yes, cancel run' })
    getByRole('button', { name: 'no, go back' })
  })
  it('should call yes cancel run button', () => {
    const { getByRole } = render(props)
    expect(props.onClose).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'yes, cancel run' })
    fireEvent.click(closeButton)
    expect(props.onClose).toHaveBeenCalled()
  })
  it('should call No go back button', () => {
    const { getByRole } = render(props)
    const closeButton = getByRole('button', { name: 'no, go back' })
    fireEvent.click(closeButton)
    expect(props.onClose).toHaveBeenCalled()
  })
})
