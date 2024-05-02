import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { useWifiList } from '../../../resources/networking/hooks'
import { getNetworkInterfaces, INTERFACE_WIFI } from '../../../redux/networking'
import * as Fixtures from '../../../redux/networking/__fixtures__'
import { NetworkDetailsModal } from '../../RobotSettingsDashboard/NetworkSettings/NetworkDetailsModal'
import { WifiConnectionDetails } from '../WifiConnectionDetails'

import type { useHistory } from 'react-router-dom'

vi.mock('../../../resources/networking/hooks')
vi.mock('../../../redux/networking')
vi.mock('../../../redux/discovery/selectors')
vi.mock('../../RobotSettingsDashboard/NetworkSettings/NetworkDetailsModal')

const mockPush = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof useHistory>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof WifiConnectionDetails>) => {
  return renderWithProviders(
    <MemoryRouter>
      <WifiConnectionDetails {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const initialMockWifi = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: INTERFACE_WIFI,
}

const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar', active: false },
]

describe('WifiConnectionDetails', () => {
  let props: React.ComponentProps<typeof WifiConnectionDetails>
  beforeEach(() => {
    props = {
      ssid: 'mockWifi',
      authType: 'wpa-psk',
    }
    vi.mocked(getNetworkInterfaces).mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    vi.mocked(useWifiList).mockReturnValue(mockWifiList)
    vi.mocked(NetworkDetailsModal).mockReturnValue(
      <div>mock NetworkDetailsModal</div>
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render title and description', () => {
    render(props)
    screen.getByText('Wi-Fi')
    screen.getByText('Successfully connected to mockWifi!')
    screen.getByText('View network details')
    screen.getByText('Continue')
  })

  it('should render network details when tapping view network details', () => {
    render(props)
    fireEvent.click(screen.getByText('View network details'))
    screen.getByText('mock NetworkDetailsModal')
  })

  it('when clicking Check for updates button, should call mock function', () => {
    render(props)
    fireEvent.click(screen.getByText('Continue'))
    expect(mockPush).toHaveBeenCalledWith(
      '/robot-settings/update-robot-during-onboarding'
    )
  })
})
