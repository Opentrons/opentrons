import uniqBy from 'lodash/uniqBy'
import orderBy from 'lodash/orderBy'
import { useWifiList } from '@opentrons/react-api-client'

const LIST_ORDER = [
  ['active', 'ssid'],
  ['desc', 'asc'],
]

export const useWifiList = (robotName: string): any[] => {
  const wifiQuery = useWifiQuery()
  const wifiList = wifiQuery.data?.data != null ? wifiQuery.data?.data : []

  return uniqBy(orderBy(wifiList, ...LIST_ORDER), 'ssid')
}
