import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { NetworkSetupMenu } from '../NetworkSetupMenu'

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
      <NetworkSetupMenu />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('NetworkSetupMenu', () => {
  it('should render text and button, and step meter', () => {
    const [{ getByText }] = render()

    getByText('Connect to a network')
    getByText(
      'You’ll use this connection to run software updates and load protocols onto your Opentrons Flex.'
    )
    getByText('Wi-Fi')
    getByText('Find a network in your lab or enter your own.')
    getByText('Ethernet')
    getByText("Connect to your lab's wired network.")
    getByText('USB')
    getByText('Connect directly to a computer (running the Opentrons App).')
  })

  it('should call mock function when tapping a button', () => {
    const [{ getByText }] = render()
    const wifiButton = getByText('Wi-Fi')
    const ethernetButton = getByText('Ethernet')
    const usbButton = getByText('USB')
    fireEvent.click(wifiButton)
    expect(mockPush).toHaveBeenCalledWith('/network-setup/wifi')
    fireEvent.click(ethernetButton)
    expect(mockPush).toHaveBeenCalledWith('/network-setup/ethernet')
    fireEvent.click(usbButton)
    expect(mockPush).toHaveBeenCalledWith('/network-setup/usb')
  })
})
