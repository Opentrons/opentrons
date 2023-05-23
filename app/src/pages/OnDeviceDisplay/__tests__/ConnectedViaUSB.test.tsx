import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { ConnectViaUSB } from '../ConnectViaUSB'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ConnectViaUSB />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConnectViaUSB', () => {
  it('should render text, button, and image', () => {
    const [{ getByText, getByLabelText }] = render()
    getByText('USB')
    getByText('No connection found')
    getByLabelText('Connect_via_usb_back_button')
    getByText('1. Connect the USB A-to-B cable to the robot’s USB-B port.')
    getByText('2. Connect the cable to an open USB port on your computer.')
    getByText('3. Launch the Opentrons App on the computer to continue.')
  })

  it('should call a mock function when tapping back button', () => {
    const [{ getByRole }] = render()
    getByRole('button').click()
    expect(mockPush).toHaveBeenCalledWith('/network-setup')
  })

  // Note the following cases will be activated when the connection check functionality is ready
  /*
  it('should render text and button', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Connect via USB')
    getByRole('button', { name: 'Back' })
    getByText('Successfully connected!')
    getByRole('button', { name: 'Next step' })
  })

  it('should call a mock function when tapping next step button', () => {
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Next step' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/path-to-name-screen')
  })
  */
})
