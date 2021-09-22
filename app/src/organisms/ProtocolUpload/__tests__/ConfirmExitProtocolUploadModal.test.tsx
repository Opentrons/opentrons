import * as React from 'react'
import { renderWithProviders } from '@opentrons/components/__utils__'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { ConfirmExitProtocolUploadModal } from '../ConfirmExitProtocolUploadModal'

const render = (
  props: React.ComponentProps<typeof ConfirmExitProtocolUploadModal>
) => {
  return renderWithProviders(<ConfirmExitProtocolUploadModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ConfirmExitProtocolUploadModal', () => {
  let props: React.ComponentProps<typeof ConfirmExitProtocolUploadModal>
  beforeEach(() => {
    props = { back: jest.fn(), exit: jest.fn() }
  })

  it('should render the correct title', () => {
    const { getByText } = render(props)
    getByText('Confirm Close Protocol')
  })
  it('should render the correct body', () => {
    const { getByText } = render(props)
    getByText('Are you sure you want to close this protocol?')
  })
  it('should render both buttons', () => {
    const { getByRole } = render(props)
    expect(props.back).not.toHaveBeenCalled()
    expect(props.exit).not.toHaveBeenCalled()
    getByRole('button', { name: 'Yes, close now' })
    getByRole('button', { name: 'No, go back' })
  })
  it('should call Yes close now button', () => {
    const { getByRole } = render(props)
    expect(props.exit).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'Yes, close now' })
    fireEvent.click(closeButton)
    expect(props.exit).toHaveBeenCalled()
  })
  it('should call No go back button', () => {
    const { getByRole } = render(props)
    expect(props.back).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'No, go back' })
    fireEvent.click(closeButton)
    expect(props.back).toHaveBeenCalled()
  })
})
