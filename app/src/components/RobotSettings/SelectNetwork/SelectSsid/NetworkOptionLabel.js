// @flow
import * as React from 'react'
import { Icon } from '@opentrons/components'
import { SECURITY_NONE } from '../../../../networking'

import * as Constants from './constants'
import styles from './NetworkOptionLabel.css'

import type { IconName } from '@opentrons/components'
import type { WifiNetwork } from '../../../../networking/types'

export const NetworkOptionLabel = (props: WifiNetwork) => (
  <div className={styles.wifi_option}>
    {props.active ? (
      <Icon name="check" className={styles.wifi_option_icon} />
    ) : (
      <span className={styles.wifi_option_icon} />
    )}
    <span className={styles.wifi_name}>{props.ssid}</span>
    {props.securityType !== SECURITY_NONE ? (
      <Icon name="lock" className={styles.wifi_option_icon_right} />
    ) : (
      <span className={styles.wifi_option_icon_right} />
    )}
    {renderSignalIcon(props.signal)}
  </div>
)

export const NetworkActionLabel = ({ label }: {| label: string |}) => (
  <span className={styles.wifi_additional_actions}>{label}</span>
)

const renderSignalIcon = signal => {
  let iconName: IconName

  if (signal <= Constants.SIGNAL_LEVEL_LOW) {
    iconName = 'ot-wifi-0'
  } else if (signal <= Constants.SIGNAL_LEVEL_MED) {
    iconName = 'ot-wifi-1'
  } else if (signal <= Constants.SIGNAL_LEVEL_HIGH) {
    iconName = 'ot-wifi-2'
  } else {
    iconName = 'ot-wifi-3'
  }

  return <Icon name={iconName} />
}
