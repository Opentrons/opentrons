import { when, resetAllWhenMocks } from 'jest-when'
import { SECURITY_WPA_EAP, WifiNetwork } from '@opentrons/api-client'
import { useWifiQuery } from '@opentrons/react-api-client'
import { useRobot } from '../../../organisms/Devices/hooks'
import { useWifiList } from '../hooks'
import type { WifiListResponse } from '@opentrons/api-client'
import type { UseQueryResult } from 'react-query'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../organisms/Devices/hooks')

const mockUseWifiQuery = useWifiQuery as jest.MockedFunction<
  typeof useWifiQuery
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>

const mockWifiNetwork: WifiNetwork = {
  ssid: 'linksys',
  signal: 50,
  active: false,
  security: 'WPA2 802.1X',
  securityType: SECURITY_WPA_EAP,
}

describe('useWifiList', () => {
  beforeEach(() => {
    when(mockUseRobot).calledWith(null).mockReturnValue(null)
  })
  afterEach(() => resetAllWhenMocks())

  it('returns empty list if unavailable', () => {
    when(mockUseWifiQuery)
      .calledWith(expect.anything(), null)
      .mockReturnValue({
        data: {},
      } as UseQueryResult<WifiListResponse>)
    const wifiList = useWifiList()
    expect(wifiList).toEqual([])
  })
  it('getWifiList returns wifiList from state', () => {
    when(mockUseWifiQuery)
      .calledWith(expect.anything(), null)
      .mockReturnValue(({
        data: { list: [mockWifiNetwork] },
      } as unknown) as UseQueryResult<WifiListResponse>)
    const wifiList = useWifiList()
    expect(wifiList).toEqual([mockWifiNetwork])
  })
  it('getWifiList dedupes duplicate SSIDs', () => {
    when(mockUseWifiQuery)
      .calledWith(expect.anything(), null)
      .mockReturnValue(({
        data: { list: [mockWifiNetwork, mockWifiNetwork] },
      } as unknown) as UseQueryResult<WifiListResponse>)
    const wifiList = useWifiList()
    expect(wifiList).toEqual([mockWifiNetwork])
  })
  it('getWifiList sorts by active then ssid', () => {
    when(mockUseWifiQuery)
      .calledWith(expect.anything(), null)
      .mockReturnValue(({
        data: {
          list: [
            { ...mockWifiNetwork, ssid: 'bbb' },
            { ...mockWifiNetwork, ssid: 'aaa' },
            { ...mockWifiNetwork, active: true, ssid: 'zzz' },
          ],
        },
      } as unknown) as UseQueryResult<WifiListResponse>)
    const wifiList = useWifiList()
    expect(wifiList).toEqual([
      { ...mockWifiNetwork, active: true, ssid: 'zzz' },
      { ...mockWifiNetwork, ssid: 'aaa' },
      { ...mockWifiNetwork, ssid: 'bbb' },
    ])
  })
  it('getWifiList sorts by active then ssid then dedupes', () => {
    when(mockUseWifiQuery)
      .calledWith(expect.anything(), null)
      .mockReturnValue(({
        data: {
          list: [
            { ...mockWifiNetwork, ssid: 'bbb' },
            { ...mockWifiNetwork, ssid: 'aaa' },
            { ...mockWifiNetwork, active: true, ssid: 'aaa' },
          ],
        },
      } as unknown) as UseQueryResult<WifiListResponse>)
    const wifiList = useWifiList()
    expect(wifiList).toEqual([
      { ...mockWifiNetwork, active: true, ssid: 'aaa' },
      { ...mockWifiNetwork, ssid: 'bbb' },
    ])
  })
})
