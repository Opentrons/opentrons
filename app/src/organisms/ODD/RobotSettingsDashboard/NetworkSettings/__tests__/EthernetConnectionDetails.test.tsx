import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

import { i18n } from '../../../../i18n'
import { INTERFACE_ETHERNET } from '../../../../redux/networking'
import { getNetworkInterfaces } from '../../../../redux/networking/selectors'
import { renderWithProviders } from '../../../../__testing-utils__'
import { getLocalRobot } from '../../../../redux/discovery'
import { mockConnectedRobot } from '../../../../redux/discovery/__fixtures__'
import { EthernetConnectionDetails } from '../EthernetConnectionDetails'

vi.mock('../../../../redux/discovery')
vi.mock('../../../../redux/discovery/selectors')
vi.mock('../../../../redux/networking/selectors')

const render = (
  props: React.ComponentProps<typeof EthernetConnectionDetails>
) => {
  return renderWithProviders(<EthernetConnectionDetails {...props} />, {
    i18nInstance: i18n,
  })
}

const mockEthernet = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'ET:NT:00:00:00:00',
  type: INTERFACE_ETHERNET,
}

describe('EthernetConnectionDetails', () => {
  let props: React.ComponentProps<typeof EthernetConnectionDetails>
  beforeEach(() => {
    props = {
      handleGoBack: vi.fn(),
    }
    vi.mocked(getLocalRobot).mockReturnValue(mockConnectedRobot)
    vi.mocked(getNetworkInterfaces).mockReturnValue({
      wifi: null,
      ethernet: mockEthernet,
    })
  })

  it('should render ip address, subnet mask, mac address, text and button when ethernet is connected', () => {
    render(props)
    screen.getByText('IP Address')
    screen.getByText('Subnet Mask')
    screen.getByText('MAC Address')
    screen.getByText('127.0.0.100')
    screen.getByText('255.255.255.230')
    screen.getByText('ET:NT:00:00:00:00')
    expect(
      screen.queryByText(
        'Connect an Ethernet cable to the back of the robot and a network switch or hub.'
      )
    ).not.toBeInTheDocument()
  })

  it('should render mac address no data when ethernet is not connected', () => {
    const notConnectedMockEthernet = {
      ipAddress: null,
      subnetMask: null,
      macAddress: 'ET:NT:00:00:00:11',
      type: INTERFACE_ETHERNET,
    }
    vi.mocked(getNetworkInterfaces).mockReturnValue({
      wifi: null,
      ethernet: notConnectedMockEthernet,
    })
    render(props)
    screen.getByText('IP Address')
    screen.getByText('Subnet Mask')
    screen.getByText('MAC Address')
    expect(screen.getAllByText('No data').length).toBe(2)
    screen.getByText('ET:NT:00:00:00:11')
    screen.getByText(
      'Connect an Ethernet cable to the back of the robot and a network switch or hub.'
    )
  })

  it('should call handleGoBack when pressing back', () => {
    render(props)
    const backButton = screen.getByRole('button')
    fireEvent.click(backButton)
    expect(props.handleGoBack).toHaveBeenCalled()
  })
})
