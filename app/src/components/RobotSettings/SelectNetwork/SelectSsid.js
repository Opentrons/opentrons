// @flow
import * as React from 'react'
import find from 'lodash/find'
import map from 'lodash/map'

import { Icon, SelectField } from '@opentrons/components'
import styles from './styles.css'

import type { GroupType, IconName, OptionType } from '@opentrons/components'
import type { WifiNetwork, WifiNetworkList } from '../../../http-api-client'

type Props = {
  list: ?WifiNetworkList,
  disabled?: boolean,
  onValueChange: (name: string, ssid: ?string) => mixed,
}

const JOIN_OTHER_GROUP: GroupType = {
  label: null,
  options: [
    {
      value: null,
      label: <p className={styles.wifi_join_other}>Join other network...</p>,
    },
  ],
}

export default function SelectSsid(props: Props) {
  const { list, disabled, onValueChange } = props
  const connected = find(list, 'active')
  const value = connected && connected.ssid

  return (
    <SelectField
      name="ssid"
      value={value}
      options={map(list, makeNetworkOption).concat(JOIN_OTHER_GROUP)}
      onValueChange={onValueChange}
      placeholder="Select network"
      className={styles.wifi_dropdown}
      disabled={disabled}
    />
  )
}

function makeNetworkOption(nw: WifiNetwork): OptionType {
  const value = nw.ssid
  const connectedIcon = nw.active ? (
    <Icon name="check" className={styles.wifi_option_icon} />
  ) : (
    <span className={styles.wifi_option_icon} />
  )

  const securedIcon =
    nw.securityType && nw.securityType !== 'none' ? (
      <Icon name="lock" className={styles.wifi_option_icon_right} />
    ) : (
      <span className={styles.wifi_option_icon_right} />
    )

  let signalIconName: IconName
  if (nw.signal <= 25) {
    signalIconName = 'ot-wifi-0'
  } else if (nw.signal <= 50) {
    signalIconName = 'ot-wifi-1'
  } else if (nw.signal <= 75) {
    signalIconName = 'ot-wifi-2'
  } else {
    signalIconName = 'ot-wifi-3'
  }
  const signalIcon = (
    <Icon name={signalIconName} className={styles.wifi_option_icon_right} />
  )

  const label = (
    <div className={styles.wifi_option}>
      {connectedIcon}
      <span className={styles.wifi_name}>{value}</span>
      {securedIcon}
      {signalIcon}
    </div>
  )

  return { value, label }
}
