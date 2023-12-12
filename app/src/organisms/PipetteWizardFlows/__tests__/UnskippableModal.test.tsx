import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { UnskippableModal } from '../UnskippableModal'

const render = (props: React.ComponentProps<typeof UnskippableModal>) => {
  return renderWithProviders(<UnskippableModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UnskippableModal', () => {
  let props: React.ComponentProps<typeof UnskippableModal>
  it('returns the correct information for unskippable modal, pressing return button calls goBack prop', () => {
    props = {
      goBack: jest.fn(),
      proceed: jest.fn(),
      isOnDevice: false,
      isRobotMoving: false,
    }
    render(props)
    screen.getByText('This is a critical step that should not be skipped')
    screen.getByText(
      'You must detach the mounting plate and reattach the z-axis carraige before using other pipettes. We do not recommend exiting this process before completion.'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    expect(props.goBack).toHaveBeenCalled()
  })
  it('renders the is on device button with correct text when it is on device display', () => {
    props = {
      goBack: jest.fn(),
      proceed: jest.fn(),
      isOnDevice: true,
      isRobotMoving: false,
    }
    render(props)
    screen.getByText('This is a critical step that should not be skipped')
    screen.getByText(
      'You must detach the mounting plate and reattach the z-axis carraige before using other pipettes. We do not recommend exiting this process before completion.'
    )
    fireEvent.click(screen.getByRole('button', {name: 'exit'}))
    expect(props.proceed).toHaveBeenCalled()
  })
})
