// @flow
import * as React from 'react'

import { SelectField } from '@opentrons/components'
import * as Constants from './constants'
import { NetworkOptionLabel, NetworkActionLabel } from './NetworkOptionLabel'
import styles from './styles.css'

import type { SelectOptionOrGroup } from '@opentrons/components'
import type { WifiNetwork } from '../../../../networking/types'

export type SelectSsidProps = {|
  list: Array<WifiNetwork>,
  value: string | null,
  showWifiDisconnect: boolean,
  onConnect: (ssid: string) => mixed,
  onJoinOther: () => mixed,
  onDisconnect: () => mixed,
|}

const formatOptions = (
  list: Array<WifiNetwork>,
  showWifiDisconnect: boolean
): Array<SelectOptionOrGroup> => {
  const ssidOptionsList = { options: list.map(({ ssid }) => ({ value: ssid })) }
  const options = [ssidOptionsList, Constants.SELECT_JOIN_OTHER_GROUP]

  if (showWifiDisconnect) {
    options.unshift(Constants.SELECT_DISCONNECT_GROUP)
  }

  return options
}

export function SelectSsid(props: SelectSsidProps) {
  const {
    list,
    value,
    onConnect,
    onJoinOther,
    onDisconnect,
    showWifiDisconnect,
  } = props

  const handleValueChange = (_, value) => {
    if (value === Constants.JOIN_OTHER_VALUE) {
      onJoinOther()
    } else if (value === Constants.DISCONNECT_WIFI_VALUE) {
      onDisconnect()
    } else {
      onConnect(value)
    }
  }

  const formatOptionLabel = option => {
    const { value, label } = option

    if (label != null) return <NetworkActionLabel label={label} />
    const network = list.find(nw => nw.ssid === value)
    return network ? <NetworkOptionLabel {...network} /> : null
  }

  return (
    <SelectField
      name={Constants.FIELD_NAME}
      value={value}
      options={formatOptions(list, showWifiDisconnect)}
      placeholder={Constants.PLACEHOLDER}
      className={styles.wifi_dropdown}
      onValueChange={handleValueChange}
      formatOptionLabel={formatOptionLabel}
    />
  )
}
