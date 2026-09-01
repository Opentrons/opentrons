import { useTranslation } from 'react-i18next'

import { useNetworkInterfaces } from './useNetworkInterfaces'
import { useWifiList } from './useWifiList'

import type { IconName } from '@opentrons/components'

export interface NetworkConnection {
  isWifiConnected: boolean
  isEthernetConnected: boolean
  isUsbConnected: boolean
  connectionStatus: string
  activeSsid?: string
  icon?: IconName
}

const CONNECTION_POLL_MS = 10000

export function useNetworkConnection(robotName: string): NetworkConnection {
  const { t } = useTranslation('device_settings')
  let connectionStatus: string = ''
  let iconName: 'wifi' | 'usb' | 'ethernet' | null = null
  const list = useWifiList(robotName, CONNECTION_POLL_MS)
  const { wifi, ethernet } = useNetworkInterfaces(robotName, CONNECTION_POLL_MS)
  const activeSsid = list.find(nw => nw.active)?.ssid

  const isWifiConnected = wifi?.ipAddress != null
  const isEthernetConnected = ethernet?.ipAddress != null
  // ToDo (kj:02/02/2023) Add USB connection when USB is ready
  const isUsbConnected = false

  if (isWifiConnected) {
    connectionStatus = t('connected_via', { networkInterface: t('wifi') })
    iconName = 'wifi'
  }

  if (isEthernetConnected) {
    // Note (kj:0202/2023) currently use "and" to make things easy
    // and Copy not started
    connectionStatus =
      connectionStatus.length === 0
        ? t('connected_via', { networkInterface: t('ethernet') })
        : `${connectionStatus} and ${t('ethernet')}`
    iconName = 'ethernet'
  }

  if (isUsbConnected) {
    // Note (kj:0202/2023) currently use "and" to make things easy
    // and Copy not started
    connectionStatus =
      connectionStatus.length === 0
        ? t('connected_via', { networkInterface: t('usb') })
        : `${connectionStatus} and ${t('usb')}`
    iconName = 'usb'
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
    icon: iconName !== null ? iconName : undefined,
  }
}
