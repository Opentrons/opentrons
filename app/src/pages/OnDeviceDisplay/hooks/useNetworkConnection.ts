import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { useInterval } from '@opentrons/components'

import {
  fetchStatus,
  fetchWifiList,
  getNetworkInterfaces,
  getWifiList,
} from '../../../redux/networking'

import type { Dispatch, State } from '../../../redux/types'

export interface NetworkConnection {
  isWifiConnected: boolean
  isEthernetConnected: boolean
  isUsbConnected: boolean
  connectionStatus: string
  activeSsid?: string
}

const CONNECTION_POLL_MS = 10000 // Note: (kj:02/02/2023) temp value

export function useNetworkConnection(robotName: string): NetworkConnection {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  let connectionStatus: string = ''
  const list = useSelector((state: State) => getWifiList(state, robotName))
  const { wifi, ethernet } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const activeSsid = list.find(nw => nw.active)?.ssid

  useInterval(
    () => {
      dispatch(fetchStatus(robotName))
      dispatch(fetchWifiList(robotName))
    },
    CONNECTION_POLL_MS,
    true
  )

  const isWifiConnected = wifi?.ipAddress != null
  const isEthernetConnected = ethernet?.ipAddress != null
  // ToDo (kj:02/02/2023) Add USB connection when USB is ready
  const isUsbConnected = false

  if (isWifiConnected) {
    connectionStatus = t('connected_via', { networkInterface: t('wifi') })
  }

  if (isEthernetConnected) {
    // Note (kj:0202/2023) currently use "and" to make things easy
    // and Copy not started
    connectionStatus =
      connectionStatus.length === 0
        ? t('connected_via', { networkInterface: t('ethernet') })
        : `${connectionStatus} and ${t('ethernet')}`
  }

  if (isUsbConnected) {
    // Note (kj:0202/2023) currently use "and" to make things easy
    // and Copy not started
    connectionStatus =
      connectionStatus.length === 0
        ? t('connected_via', { networkInterface: t('usb') })
        : `${connectionStatus} and ${t('usb')}`
  }

  if (isWifiConnected && !isEthernetConnected && !isUsbConnected) {
    connectionStatus = activeSsid != null ? activeSsid : ''
  }

  if (!isWifiConnected && !isEthernetConnected && !isUsbConnected) {
    connectionStatus = t('not_connected')
  }

  return {
    isWifiConnected,
    isEthernetConnected,
    isUsbConnected,
    connectionStatus,
    activeSsid,
  }
}
