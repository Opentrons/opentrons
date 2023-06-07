import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { NetworkDetailsModal } from '../NetworkDetailsModal'

const mockFn = jest.fn()

const render = (props: React.ComponentProps<typeof NetworkDetailsModal>) => {
  return renderWithProviders(<NetworkDetailsModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('NetworkDetailsModal', () => {
  let props: React.ComponentProps<typeof NetworkDetailsModal>

  beforeEach(() => {
    props = {
      setShowNetworkDetailModal: mockFn,
      ipAddress: '192.168.1.100',
      subnetMask: '255.255.255.0',
      macAddress: '00:14:2D:69:45:9F',
      ssid: 'mock Wifi ssid',
      securityType: 'WPA-2',
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render text and icon - wifi', () => {
    const [{ getByText, getByLabelText }] = render(props)
    getByText('mock Wifi ssid')
    getByText('IP Address')
    getByText('192.168.1.100')
    getByText('Security Type')
    getByText('WPA-2')
    getByText('Subnet Mask')
    getByText('255.255.255.0')
    getByText('MAC Address')
    getByText('00:14:2D:69:45:9F')
    getByLabelText('icon_wifi')
  })

  it('should render text and icon - ethernet', () => {
    const ethernetSettings = {
      setShowNetworkDetailModal: mockFn,
      ipAddress: '192.168.0.100',
      subnetMask: '255.255.255.0',
      macAddress: '00:14:2D:69:45:9A',
    }
    props = ethernetSettings
    const [{ getByText, queryByText, getByLabelText }] = render(props)
    getByText('Ethernet')
    getByText('IP Address')
    getByText('192.168.0.100')
    expect(queryByText('Security Type')).not.toBeInTheDocument()
    getByText('Subnet Mask')
    getByText('255.255.255.0')
    getByText('MAC Address')
    getByText('00:14:2D:69:45:9A')
    getByLabelText('icon_ethernet')
  })

  it('should call the mock function when tapping the close icon', () => {
    const [{ getByLabelText }] = render(props)
    getByLabelText('closeIcon').click()
    expect(mockFn).toHaveBeenCalled()
  })

  it('should call the mock function when tapping outside of the modal', () => {
    const [{ getByLabelText }] = render(props)
    getByLabelText('BackgroundOverlay').click()
    expect(mockFn).toHaveBeenCalled()
  })
})
