import { when } from 'vitest-when'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SECURITY_WPA_EAP } from '@opentrons/api-client'
import { useWifiQuery } from '@opentrons/react-api-client'
import { useRobot } from '/app/redux-resources/robots'
import { useWifiList } from '../useWifiList'
import type { UseQueryResult } from 'react-query'
import type { WifiNetwork, WifiListResponse } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux-resources/robots')

const mockWifiNetwork: WifiNetwork = {
  ssid: 'linksys',
  signal: 50,
  active: false,
  security: 'WPA2 802.1X',
  securityType: SECURITY_WPA_EAP,
}

describe('useWifiList', () => {
  beforeEach(() => {
    when(useRobot).calledWith(null).thenReturn(null)
  })

  it('returns empty list if unavailable', () => {
    when(useWifiQuery)
      .calledWith(expect.anything(), null)
      .thenReturn({
        data: {},
      } as UseQueryResult<WifiListResponse>)
    const wifiList = useWifiList()
    expect(wifiList).toEqual([])
  })
  it('getWifiList returns wifiList from state', () => {
    when(useWifiQuery)
      .calledWith(expect.anything(), null)
      .thenReturn(({
        data: { list: [mockWifiNetwork] },
      } as unknown) as UseQueryResult<WifiListResponse>)
    const wifiList = useWifiList()
    expect(wifiList).toEqual([mockWifiNetwork])
  })
  it('getWifiList dedupes duplicate SSIDs', () => {
    when(useWifiQuery)
      .calledWith(expect.anything(), null)
      .thenReturn(({
        data: { list: [mockWifiNetwork, mockWifiNetwork] },
      } as unknown) as UseQueryResult<WifiListResponse>)
    const wifiList = useWifiList()
    expect(wifiList).toEqual([mockWifiNetwork])
  })
  it('getWifiList sorts by active then ssid', () => {
    when(useWifiQuery)
      .calledWith(expect.anything(), null)
      .thenReturn(({
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
    when(useWifiQuery)
      .calledWith(expect.anything(), null)
      .thenReturn(({
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
