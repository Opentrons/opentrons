// @flow

import * as React from 'react'

import { ErrorModal } from '../../modals'
import { DISCONNECT } from './constants'

import type { NetworkChangeType } from './types'

export type FailureModalProps = {|
  type: NetworkChangeType,
  ssid: string | null,
  error: { message?: string, ... },
  onClose: () => mixed,
|}

// TODO(mc, 2020-03-04): i18n
const UNABLE_TO_DISCONNECT = 'Unable to disconnect from Wi-Fi'
const UNABLE_TO_CONNECT = 'Unable to connect to Wi-Fi'

const YOUR_ROBOT_WAS_UNABLE_TO_DISCONNECT =
  'Your robot was unable to disconnect from Wi-Fi'
const YOUR_ROBOT_WAS_UNABLE_TO_CONNECT =
  'Your robot was unable to connect to Wi-Fi'
const CHECK_YOUR_CREDENTIALS = 'Please double-check your network credentials'

const NETWORK = 'network'

export const FailureModal = (props: FailureModalProps) => (
  <ErrorModal
    heading={formatHeading(props)}
    description={formatMessage(props)}
    error={props.error}
    close={props.onClose}
  />
)

const formatHeading = ({ type }: FailureModalProps) => {
  return type === DISCONNECT ? UNABLE_TO_DISCONNECT : UNABLE_TO_CONNECT
}

const formatMessage = ({ type, ssid }: FailureModalProps) => {
  const ssidSuffix = ssid != null ? ` ${NETWORK} ${ssid}` : ''
  const actionPrefix =
    type === DISCONNECT
      ? YOUR_ROBOT_WAS_UNABLE_TO_DISCONNECT
      : YOUR_ROBOT_WAS_UNABLE_TO_CONNECT
  const retrySuffix = type !== DISCONNECT ? ` ${CHECK_YOUR_CREDENTIALS}.` : ''

  return `${actionPrefix}${ssidSuffix}.${retrySuffix}`
}
