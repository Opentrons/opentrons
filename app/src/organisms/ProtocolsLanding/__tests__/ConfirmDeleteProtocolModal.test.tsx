import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { ConfirmDeleteProtocolModal } from '../ConfirmDeleteProtocolModal'

const render = (
  props: React.ComponentProps<typeof ConfirmDeleteProtocolModal>
) => {
  return renderWithProviders(<ConfirmDeleteProtocolModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConfirmDeleteProtocolModal', () => {
  let props: React.ComponentProps<typeof ConfirmDeleteProtocolModal>

  beforeEach(() => {
    props = {
      cancelDeleteProtocol: jest.fn(),
      handleClickDelete: jest.fn(),
    }
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders correct text', () => {
    const { getByText } = render(props)
    getByText('Delete this protocol?')
    getByText(
      'This protocol will be moved to this computer’s trash and may be unrecoverable.'
    )
  })

  it('renders buttons and clicking on them call corresponding props', () => {
    props = {
      cancelDeleteProtocol: jest.fn(),
      handleClickDelete: jest.fn(),
    }
    const { getByText, getByRole } = render(props)
    const cancel = getByText('cancel')
    fireEvent.click(cancel)
    expect(props.cancelDeleteProtocol).toHaveBeenCalled()
    const confirm = getByRole('button', { name: 'Yes, delete protocol' })
    fireEvent.click(confirm)
    expect(props.handleClickDelete).toHaveBeenCalled()
  })
})
