// @flow

import * as React from 'react'

import { AlertModal, SpinnerModal } from '@opentrons/components'
import { ErrorModal } from '../../modals'
import { DISCONNECT } from './constants'
import * as Copy from './i18n'

import type { NetworkChangeType } from './types'

export type ResultModalProps = {|
  type: NetworkChangeType,
  ssid: string | null,
  isPending: boolean,
  error: { message?: string, ... } | null,
  onClose: () => mixed,
|}

export const ResultModal = (props: ResultModalProps) => {
  const { type, ssid, isPending, error, onClose } = props
  const isDisconnect = type === DISCONNECT

  if (isPending) {
    const message = isDisconnect
      ? Copy.DISCONNECTING_FROM_NETWORK(ssid)
      : Copy.CONNECTING_TO_NETWORK(ssid)

    return <SpinnerModal alertOverlay message={message} />
  }

  if (error) {
    const heading = isDisconnect
      ? Copy.UNABLE_TO_DISCONNECT
      : Copy.UNABLE_TO_CONNECT

    const message = isDisconnect
      ? Copy.YOUR_ROBOT_WAS_UNABLE_TO_DISCONNECT(ssid)
      : Copy.YOUR_ROBOT_WAS_UNABLE_TO_CONNECT(ssid)

    const retryMessage = !isDisconnect ? ` ${Copy.CHECK_YOUR_CREDENTIALS}.` : ''

    return (
      <ErrorModal
        heading={heading}
        description={`${message}.${retryMessage}`}
        error={error}
        close={onClose}
      />
    )
  }

  const heading = isDisconnect
    ? Copy.SUCCESSFULLY_DISCONNECTED
    : Copy.SUCCESSFULLY_CONNECTED

  const message = isDisconnect
    ? Copy.YOUR_ROBOT_HAS_DISCONNECTED(ssid)
    : Copy.YOUR_ROBOT_HAS_CONNECTED(ssid)

  return (
    <AlertModal
      alertOverlay
      iconName="wifi"
      heading={heading}
      onCloseClick={props.onClose}
      buttons={[{ children: Copy.CLOSE, onClick: onClose }]}
    >
      {message}
    </AlertModal>
  )
}
