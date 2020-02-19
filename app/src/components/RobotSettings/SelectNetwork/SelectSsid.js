// @flow
import * as React from 'react'
import find from 'lodash/find'

import { Icon, SelectField } from '@opentrons/components'
import styles from './styles.css'

import type { IconName, SelectOptionOrGroup } from '@opentrons/components'
import type { WifiNetworkList, WifiNetwork } from '../../../http-api-client'

export type SelectSsidProps = {|
  list: WifiNetworkList,
  disabled?: boolean,
  handleOnValueChange: (ssid: string) => mixed,
|}

const DISCONNECT_WIFI_VALUE = '__disconnect-from-wifi__'
const DISCONNECT_WIFI_LABEL = 'Disconnect from Wifi'
const JOIN_OTHER_VALUE = '__join-other-network__'
const JOIN_OTHER_LABEL = 'Join other network...'

const ACTIONS = {
  [JOIN_OTHER_VALUE.toString()]: JOIN_OTHER_LABEL,
  [DISCONNECT_WIFI_VALUE.toString()]: DISCONNECT_WIFI_LABEL,
}

// Type this
const SELECT_ACTIONS_OPTIONS = [
  { value: JOIN_OTHER_VALUE },
  { value: DISCONNECT_WIFI_VALUE },
]

const FIELD_NAME = 'ssid'

const SIGNAL_LEVEL_LOW = 25
const SIGNAL_LEVEL_MED = 50
const SIGNAL_LEVEL_HIGH = 75

const formatOptions = (list: WifiNetworkList): Array<SelectOptionOrGroup> =>
  list.map(({ ssid }) => ({ value: ssid })).concat(SELECT_ACTIONS_OPTIONS)

export function SelectSsid(props: SelectSsidProps) {
  const { list, disabled, handleOnValueChange } = props
  const connected = find(list, 'active')
  const value = connected?.ssid || null

  return (
    <SelectField
      name={FIELD_NAME}
      value={value}
      options={formatOptions(list)}
      placeholder="Select network"
      className={styles.wifi_dropdown}
      disabled={disabled}
      onValueChange={(_, ssid) => handleOnValueChange(ssid)}
      formatOptionLabel={({ value, label }) => {
        return (
          <>
            {ACTIONS[value] ? (
              <p className={styles.wifi_join_other}>{ACTIONS[value]}</p>
            ) : (
              renderNetworkLabel(props.list.find(nw => nw.ssid === value))
            )}
          </>
        )
      }}
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
  if (signal <= SIGNAL_LEVEL_LOW) {
    signalIconName = 'ot-wifi-0'
  } else if (signal <= SIGNAL_LEVEL_MED) {
    signalIconName = 'ot-wifi-1'
  } else if (signal <= SIGNAL_LEVEL_HIGH) {
    signalIconName = 'ot-wifi-2'
  } else {
    signalIconName = 'ot-wifi-3'
  }
  return (
    <Icon name={signalIconName} className={styles.wifi_option_icon_right} />
  )
}
