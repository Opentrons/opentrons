// @flow
import * as React from 'react'
import find from 'lodash/find'

import { Icon, SelectField } from '@opentrons/components'
import styles from './styles.css'

import type { IconName, SelectOptionOrGroup } from '@opentrons/components'
import type { WifiNetworkList } from '../../../http-api-client'

export type SelectSsidProps = {
  list: WifiNetworkList,
  disabled?: boolean,
  onValueChange: (name: string, ssid: ?string) => mixed,
}

const JOIN_OTHER_VALUE = '__join-other-network__'
const JOIN_OTHER_LABEL = 'Join other network...'
const JOIN_OTHER_GROUP: SelectOptionOrGroup = {
  options: [{ value: JOIN_OTHER_VALUE }],
}

const FIELD_NAME = 'ssid'

export function SelectSsid(props: SelectSsidProps) {
  const { list, disabled } = props
  const connected = find(list, 'active')
  const value = connected?.ssid || null
  const handleValueChange = (name, value) => {
    props.onValueChange(name, value !== JOIN_OTHER_VALUE ? value : null)
  }

  return (
    <SelectField
      name={FIELD_NAME}
      value={value}
      options={list
        .map(({ ssid }) => ({ value: ssid }))
        .concat(JOIN_OTHER_GROUP)}
      onValueChange={handleValueChange}
      placeholder="Select network"
      className={styles.wifi_dropdown}
      disabled={disabled}
      formatOptionLabel={({ value, label }) => {
        if (value === JOIN_OTHER_VALUE) {
          return <p className={styles.wifi_join_other}>{JOIN_OTHER_LABEL}</p>
        }

        const network = props.list.find(nw => nw.ssid === value)
        const connectedIcon = network?.active ? (
          <Icon name="check" className={styles.wifi_option_icon} />
        ) : (
          <span className={styles.wifi_option_icon} />
        )

        const securedIcon =
          network?.securityType && network?.securityType !== 'none' ? (
            <Icon name="lock" className={styles.wifi_option_icon_right} />
          ) : (
            <span className={styles.wifi_option_icon_right} />
          )

        const signal = network?.signal || 0
        let signalIconName: IconName
        if (signal <= 25) {
          signalIconName = 'ot-wifi-0'
        } else if (signal <= 50) {
          signalIconName = 'ot-wifi-1'
        } else if (signal <= 75) {
          signalIconName = 'ot-wifi-2'
        } else {
          signalIconName = 'ot-wifi-3'
        }
        const signalIcon = (
          <Icon
            name={signalIconName}
            className={styles.wifi_option_icon_right}
          />
        )

        return (
          <div className={styles.wifi_option}>
            {connectedIcon}
            <span className={styles.wifi_name}>{value}</span>
            {securedIcon}
            {signalIcon}
          </div>
        )
      }}
    />
  )
}
