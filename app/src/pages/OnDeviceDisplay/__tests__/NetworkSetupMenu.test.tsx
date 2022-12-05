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
    const [{ getByText, getAllByText }] = render()

    getByText('Let’s connect to a network')
    getByText('Choose your connection type from the options below.')

    // currently this screen uses the same text for each button
    // in the future descriptions will be updated
    const descriptions = getAllByText(
      'Find a network in your lab or enter your own.'
    )
    expect(descriptions.length).toBe(3)
    getByText('Wi-Fi')
    getByText('Ethernet')
    getByText('USB')
  })

  it('should call mock function when tapping a button', () => {
    const [{ getByText }] = render()
    const wifiButton = getByText('Wi-Fi')
    const ethernetButton = getByText('Ethernet')
    const usbButton = getByText('USB')
    fireEvent.click(wifiButton)
    expect(mockPush).toHaveBeenCalledWith('/connect-via-wifi')
    fireEvent.click(ethernetButton)
    expect(mockPush).toHaveBeenCalledWith('/connect-via-ethernet')
    fireEvent.click(usbButton)
    expect(mockPush).toHaveBeenCalledWith('/connect-via-usb')
  })
})
