// @flow
import * as React from 'react'

import {
  SECURITY_WPA_PSK,
  SECURITY_WPA_EAP,
  SECURITY_NONE,
} from '../../../../networking'
import { Portal } from '../../../portal'
import { ScrollableAlertModal } from '../../../modals'
import { ConnectForm } from './ConnectForm'
import styles from './styles.css'

import type { ConnectFormProps } from './ConnectForm'
import * as Types from '../types'

// TODO(mc, 2020-03-04): i18n
const FIND_AND_JOIN = 'Find and join a Wi-Fi network'
const CONNECT_TO = 'Connect to'
const ENTER_NAME_AND_SECURITY_TYPE = 'Enter the network name and security type.'
const WIFI_NETWORK = 'Wi-Fi network'
const REQUIRES_WPA2_PASSWORD = 'requires a WPA2 password'
const REQUIRES_802_1X = 'requires 802.1X authentication'
const IS_UNSECURED = 'is unsecured'
const CANCEL = 'cancel'
const CONNECT = 'connect'
const SECURITY_DESC = {
  [SECURITY_WPA_PSK]: REQUIRES_WPA2_PASSWORD,
  [SECURITY_WPA_EAP]: REQUIRES_802_1X,
  [SECURITY_NONE]: IS_UNSECURED,
}

const formatHeading = (ssid: string | void): string => {
  return ssid == null ? FIND_AND_JOIN : `${CONNECT_TO} ${ssid}`
}

const formatBody = (network: Types.WifiNetwork | null): string => {
  return network === null
    ? ENTER_NAME_AND_SECURITY_TYPE
    : `${WIFI_NETWORK} ${network.ssid} ${SECURITY_DESC[network.securityType]}`
}

export type ConnectModalProps = $Diff<ConnectFormProps, {| id: mixed |}>

export const ConnectModalComponent = (props: ConnectModalProps) => {
  const formId = `${props.robotName}__ConnectModal`

  return (
    <ScrollableAlertModal
      alertOverlay
      heading={formatHeading(props.network?.ssid)}
      iconName="wifi"
      onCloseClick={props.onCancel}
      buttons={[
        { children: CANCEL, onClick: props.onCancel },
        { children: CONNECT, type: 'submit', form: formId },
      ]}
    >
      <p className={styles.copy}>{formatBody(props.network)}</p>
      <ConnectForm {...props} id={formId} />
    </ScrollableAlertModal>
  )
}

export const ConnectModal = (props: ConnectModalProps) => (
  <Portal>
    <ConnectModalComponent {...props} />
  </Portal>
)
