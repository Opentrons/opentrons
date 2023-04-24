import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { getLocalRobot } from '../../../../redux/discovery'
import { getWifiList } from '../../../../redux/networking'
import { NetworkSettings } from '../NetworkSettings'
import { WifiConnectionDetails } from '../../SetupNetwork'

import type { DiscoveredRobot } from '../../../../redux/discovery/types'
import type { WifiNetwork } from '../../../../redux/networking/types'

jest.mock('../../../../redux/discovery')
jest.mock('../../../../redux/networking')
jest.mock('../../SetupNetwork')

const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>
const mockGetWifiList = getWifiList as jest.MockedFunction<typeof getWifiList>
const MockWifiConnectionDetails = WifiConnectionDetails as jest.MockedFunction<
  typeof WifiConnectionDetails
>
const mockSetCurrentOption = jest.fn()

const render = (props: React.ComponentProps<typeof NetworkSettings>) => {
  return renderWithProviders(<NetworkSettings {...props} />, {
    i18nInstance: i18n,
  })
}

describe('NetworkSettings', () => {
  let props: React.ComponentProps<typeof NetworkSettings>

  beforeEach(() => {
    props = {
      setCurrentOption: mockSetCurrentOption,
      networkConnection: {
        isWifiConnected: true,
        isEthernetConnected: false,
        isUsbConnected: false,
        connectionStatus: 'Connected via Wi-Fi',
        activeSsid: 'Mock WiFi Network',
      },
    }
    mockGetLocalRobot.mockReturnValue({
      name: 'Otie',
    } as DiscoveredRobot)
    mockGetWifiList.mockReturnValue([
      {
        ssid: 'Mock WiFi Network',
        active: true,
        securityType: 'wpa-psk',
      } as WifiNetwork,
    ])
    MockWifiConnectionDetails.mockReturnValue(<div>WIFI DETAILS</div>)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('displays the wifi, ethernet, and usb network options', () => {
    const [{ getByText }] = render(props)
    expect(getByText('Wi-Fi')).toBeTruthy()
    expect(getByText('Ethernet')).toBeTruthy()
    expect(getByText('USB')).toBeTruthy()
  })

  it('selecting the Wi-Fi option displays the wifi details', () => {
    const [{ getByText }] = render(props)
    getByText('Wi-Fi').click()
    expect(getByText('WIFI DETAILS')).toBeTruthy()
  })

  it('clicking back on the wifi details screen shows the network settings page again', () => {
    const [{ getByText, queryByText, container }] = render(props)
    getByText('Wi-Fi').click()
    container.querySelector('button')?.click()
    expect(queryByText('WIFI DETAILS')).toBeFalsy()
    expect(getByText('Network Settings')).toBeTruthy()
  })
})
