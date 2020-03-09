// @flow

import * as React from 'react'

import { AlertModal, SpinnerModal } from '@opentrons/components'
import { ErrorModal } from '../../modals'
import { DISCONNECT } from './constants'

import type { NetworkChangeType } from './types'

export type ResultModalProps = {|
  type: NetworkChangeType,
  ssid: string | null,
  isPending: boolean,
  error: { message?: string, ... } | null,
  onClose: () => mixed,
|}

// TODO(mc, 2020-03-04): i18n
const CONNECTING_TO_NETWORK = 'Connecting to Wi-Fi'
const DISCONNECTING_FROM_NETWORK = 'Disconnecting from Wi-Fi'
const SUCCESSFULLY_DISCONNECTED = 'Successfully disconnected from Wi-Fi'
const SUCCESSFULLY_CONNECTED = 'Successfully connected to Wi-Fi'
const UNABLE_TO_DISCONNECT = 'Unable to disconnect from Wi-Fi'
const UNABLE_TO_CONNECT = 'Unable to connect to Wi-Fi'

const YOUR_ROBOT_HAS_DISCONNECTED =
  'Your robot has successfully disconnected from Wi-Fi'
const YOUR_ROBOT_HAS_CONNECTED =
  'Your robot has successfully connected to Wi-Fi'

const YOUR_ROBOT_WAS_UNABLE_TO_DISCONNECT =
  'Your robot was unable to disconnect from Wi-Fi'
const YOUR_ROBOT_WAS_UNABLE_TO_CONNECT =
  'Your robot was unable to connect to Wi-Fi'
const CHECK_YOUR_CREDENTIALS = 'Please double-check your network credentials'

const NETWORK = 'network'
const CLOSE = 'close'

export const ResultModal = (props: ResultModalProps) => {
  const { type, ssid, isPending, error, onClose } = props
  const ssidSuffix = ssid != null ? ` ${NETWORK} ${ssid}` : ''

  if (isPending) {
    const actionDesc =
      type === DISCONNECT ? DISCONNECTING_FROM_NETWORK : CONNECTING_TO_NETWORK

    return <SpinnerModal alertOverlay message={`${actionDesc}${ssidSuffix}`} />
  }

  if (error) {
    const heading =
      type === DISCONNECT ? UNABLE_TO_DISCONNECT : UNABLE_TO_CONNECT

    const actionDesc =
      type === DISCONNECT
        ? YOUR_ROBOT_WAS_UNABLE_TO_DISCONNECT
        : YOUR_ROBOT_WAS_UNABLE_TO_CONNECT

    const retryMessage =
      type !== DISCONNECT ? ` ${CHECK_YOUR_CREDENTIALS}.` : ''

    return (
      <ErrorModal
        heading={heading}
        description={`${actionDesc}${ssidSuffix}.${retryMessage}`}
        error={error}
        close={onClose}
      />
    )
  }
  const heading =
    type === DISCONNECT ? SUCCESSFULLY_DISCONNECTED : SUCCESSFULLY_CONNECTED

  const actionDesc =
    type === DISCONNECT ? YOUR_ROBOT_HAS_DISCONNECTED : YOUR_ROBOT_HAS_CONNECTED

  return (
    <AlertModal
      alertOverlay
      iconName="wifi"
      heading={heading}
      onCloseClick={props.onClose}
      buttons={[{ children: CLOSE, onClick: onClose }]}
    >
      {`${actionDesc}${ssidSuffix}`}
    </AlertModal>
  )
}
