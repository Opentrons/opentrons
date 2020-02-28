// @flow
import * as React from 'react'

import { Icon, SelectField } from '@opentrons/components'
import * as Constants from './constants'
import styles from './styles.css'

import type { IconName, SelectOptionOrGroup } from '@opentrons/components'
import type { WifiNetwork } from '../../../../networking/types'

export type SelectSsidProps = {|
  list: Array<WifiNetwork>,
  value: string | null,
  disabled?: boolean,
  onValueChange: (ssid: string) => mixed,
  showWifiDisconnect: boolean,
|}

const formatOptions = (
  list: Array<WifiNetwork>,
  showWifiDisconnect: boolean
): Array<SelectOptionOrGroup> => {
  const ssidOptionsList = { options: list.map(({ ssid }) => ({ value: ssid })) }
  if (showWifiDisconnect) {
    return [
      Constants.SELECT_DISCONNECT_ACTION,
      ssidOptionsList,
      Constants.SELECT_JOIN_ACTION,
    ]
  }
  return [ssidOptionsList, Constants.SELECT_JOIN_ACTION]
}

export function SelectSsid(props: SelectSsidProps) {
  const { list, value, disabled, onValueChange, showWifiDisconnect } = props

  return (
    <SelectField
      name={Constants.FIELD_NAME}
      value={value}
      options={formatOptions(list, showWifiDisconnect)}
      placeholder={Constants.PLACEHOLDER}
      className={styles.wifi_dropdown}
      disabled={disabled}
      onValueChange={(_, ssid) => onValueChange(ssid)}
      formatOptionLabel={({ value, label }) =>
        Constants.ACTIONS[value] ? (
          <span className={styles.wifi_additional_actions}>
            {Constants.ACTIONS[value]}
          </span>
        ) : (
          renderNetworkLabel(list.find(nw => nw.ssid === value))
        )
      }
    />
  )
}

const renderNetworkLabel = (network: WifiNetwork | void) => (
  <div className={styles.wifi_option}>
    {renderConnectedIcon(network)}
    <span className={styles.wifi_name}>{network?.ssid || ''}</span>
    {renderSecuredIcon(network)}
    {renderSignalIcon(network)}
  </div>
)

const renderConnectedIcon = (network: WifiNetwork | void) => (
  <>
    {network?.active ? (
      <Icon name="check" className={styles.wifi_option_icon} />
    ) : (
      <span className={styles.wifi_option_icon} />
    )}
  </>
)

const renderSecuredIcon = (network: WifiNetwork | void) => (
  <>
    {network?.securityType && network?.securityType !== 'none' ? (
      <Icon name="lock" className={styles.wifi_option_icon_right} />
    ) : (
      <span className={styles.wifi_option_icon_right} />
    )}
  </>
)

const renderSignalIcon = (network: WifiNetwork | void) => {
  const signal = network?.signal || 0
  let signalIconName: IconName
  if (signal <= Constants.SIGNAL_LEVEL_LOW) {
    signalIconName = 'ot-wifi-0'
  } else if (signal <= Constants.SIGNAL_LEVEL_MED) {
    signalIconName = 'ot-wifi-1'
  } else if (signal <= Constants.SIGNAL_LEVEL_HIGH) {
    signalIconName = 'ot-wifi-2'
  } else {
    signalIconName = 'ot-wifi-3'
  }
  return (
    <Icon name={signalIconName} className={styles.wifi_option_icon_right} />
  )
}
