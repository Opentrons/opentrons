import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
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

const PNG_FILE_NAME = 'usb@x2.png'

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
    const [{ getByText, getByRole }] = render()
    getByText('Connect via USB')
    getByRole('button', { name: 'Back' })
    getByText(
      "If you haven't already, download and launch the Opentrons App on your computer. Then connect to your OT-3 with the provided USB cable."
    )
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(PNG_FILE_NAME)
  })

  it('should call a mock function when tapping back button', () => {
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Back' })
    fireEvent.click(button)
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
