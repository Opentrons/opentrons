import * as React from 'react'
import { vi, it, describe, expect } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '../../../__testing-utils__'

import { i18n } from '../../../i18n'
import { NetworkSetupMenu } from '..'
import type * as ReactRouterDom from 'react-router-dom'

const mockPush = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof ReactRouterDom>()
  return {
    ...actual,
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

    getByText('Choose network type')
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
