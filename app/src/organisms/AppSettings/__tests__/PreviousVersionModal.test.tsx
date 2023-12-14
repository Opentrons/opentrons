import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import {
  PreviousVersionModal,
  UNINSTALL_APP_URL,
  PREVIOUS_RELEASES_URL,
} from '../PreviousVersionModal'

const render = (props: React.ComponentProps<typeof PreviousVersionModal>) => {
  return renderWithProviders(<PreviousVersionModal {...props} />, {
    i18nInstance: i18n,
  })
}
const props: React.ComponentProps<typeof PreviousVersionModal> = {
  closeModal: jest.fn(),
}

describe('PreviousVersionModal', () => {
  it('renders correct title and body text', () => {
    render(props)
    screen.getByText('How to Restore a Previous Software Version')
    screen.getByText(
      'Opentrons does not recommend reverting to previous software versions, but you can access previous releases below. For best results, uninstall the existing app and remove its configuration files before installing the previous version.'
    )
  })
  it('renders correct support links', () => {
    render(props)
    const uninstallLink = screen.getByRole('link', {
      name: 'Learn more about uninstalling the Opentrons App',
    })
    expect(uninstallLink.getAttribute('href')).toBe(UNINSTALL_APP_URL)
    const previousReleasesLink = screen.getByRole('link', {
      name: 'View previous Opentrons releases',
    })
    expect(previousReleasesLink.getAttribute('href')).toBe(
      PREVIOUS_RELEASES_URL
    )
  })
  it('renders the close button and calls closeModal when clicked', () => {
    render(props)
    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)
    expect(props.closeModal).toBeCalled()
  })
})
