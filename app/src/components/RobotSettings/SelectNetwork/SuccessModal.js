// @flow

import * as React from 'react'

import { AlertModal } from '@opentrons/components'
import { Portal } from '../../portal'
import { DISCONNECT } from './constants'

import type { NetworkChangeType } from './types'

export type SuccessModalProps = {|
  type: NetworkChangeType,
  ssid: string | null,
  onClose: () => mixed,
|}

// TODO(mc, 2020-03-04): i18n
const SUCCESSFULLY_DISCONNECTED = 'Successfully disconnected from Wi-Fi'
const SUCCESSFULLY_CONNECTED = 'Successfully connected to Wi-Fi'

const YOUR_ROBOT_HAS_DISCONNECTED =
  'Your robot has successfully disconnected from Wi-Fi'
const YOUR_ROBOT_HAS_CONNECTED =
  'Your robot has successfully connected to Wi-Fi'

const NETWORK = 'network'
const CLOSE = 'close'

export const SuccessModalComponent = (props: SuccessModalProps) => (
  <AlertModal
    alertOverlay
    iconName="wifi"
    heading={formatHeading(props)}
    onCloseClick={props.onClose}
    buttons={[{ children: CLOSE, onClick: props.onClose }]}
  >
    {formatMessage(props)}
  </AlertModal>
)

export const SuccessModal = (props: SuccessModalProps) => (
  <Portal>
    <SuccessModalComponent {...props} />
  </Portal>
)

const formatHeading = ({ type }: SuccessModalProps) => {
  return type === DISCONNECT
    ? SUCCESSFULLY_DISCONNECTED
    : SUCCESSFULLY_CONNECTED
}

const formatMessage = ({ type, ssid }: SuccessModalProps) => {
  const ssidSuffix = ssid != null ? ` ${NETWORK} ${ssid}` : ''
  const actionPrefix =
    type === DISCONNECT ? YOUR_ROBOT_HAS_DISCONNECTED : YOUR_ROBOT_HAS_CONNECTED

  return `${actionPrefix}${ssidSuffix}.`
}
