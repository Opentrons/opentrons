import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { useWifiList } from '../../../../resources/networking/hooks'
import * as Networking from '../../../../redux/networking'
import * as Fixtures from '../../../../redux/networking/__fixtures__'
import { NetworkDetailsModal } from '../../RobotSettingsDashboard/NetworkSettings/NetworkDetailsModal'
import { WifiConnectionDetails } from '../WifiConnectionDetails'

jest.mock('../../../../resources/networking/hooks')
jest.mock('../../../../redux/networking')
jest.mock('../../../../redux/discovery/selectors')
jest.mock('../../RobotSettingsDashboard/NetworkSettings/NetworkDetailsModal')

const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>
const mockUseWifiList = useWifiList as jest.MockedFunction<typeof useWifiList>
const mokcNetworkDetailsModal = NetworkDetailsModal as jest.MockedFunction<
  typeof NetworkDetailsModal
>

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
  type: Networking.INTERFACE_WIFI,
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
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    mockUseWifiList.mockReturnValue(mockWifiList)
    mokcNetworkDetailsModal.mockReturnValue(<div>mock NetworkDetailsModal</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title and description', () => {
    const [{ getByText }] = render(props)
    getByText('Wi-Fi')
    getByText('Successfully connected to mockWifi!')
    getByText('View network details')
    getByText('Continue')
  })

  it('should render network details when tapping view network details', () => {
    const [{ getByText }] = render(props)
    getByText('View network details').click()
    getByText('mock NetworkDetailsModal')
  })

  it('when clicking Check for updates button, should call mock function', () => {
    const [{ getByText }] = render(props)
    getByText('Continue').click()
    expect(mockPush).toHaveBeenCalledWith('/robot-settings/update-robot')
  })
})
