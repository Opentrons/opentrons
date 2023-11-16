import * as React from 'react'

import { AlertModal, SpinnerModal } from '@opentrons/components'

import * as Copy from './i18n'
import { ErrorModal } from '../../../../molecules/modals'
import { DISCONNECT } from './constants'
import { PENDING, FAILURE } from '../../../../redux/robot-api'

import type { NetworkChangeType } from './types'
import type { RequestStatus } from '../../../../redux/robot-api/types'

export interface ResultModalProps {
  type: NetworkChangeType
  ssid: string | null
  requestStatus: RequestStatus
  error: { message?: string; [key: string]: unknown } | null
  onClose: () => unknown
}

export const ResultModal = (props: ResultModalProps): JSX.Element => {
  const { type, ssid, requestStatus, error, onClose } = props
  const isDisconnect = type === DISCONNECT

  if (requestStatus === PENDING) {
    const message = isDisconnect
      ? Copy.DISCONNECTING_FROM_NETWORK(ssid)
      : Copy.CONNECTING_TO_NETWORK(ssid)

    return <SpinnerModal alertOverlay message={message} />
  }

  if (error || requestStatus === FAILURE) {
    const heading = isDisconnect
      ? Copy.UNABLE_TO_DISCONNECT
      : Copy.UNABLE_TO_CONNECT

    const message = isDisconnect
      ? Copy.YOUR_ROBOT_WAS_UNABLE_TO_DISCONNECT(ssid)
      : Copy.YOUR_ROBOT_WAS_UNABLE_TO_CONNECT(ssid)

    const retryMessage = !isDisconnect ? ` ${Copy.CHECK_YOUR_CREDENTIALS}.` : ''

    const placeholderError = {
      message: `Likely incorrect network password. ${Copy.CHECK_YOUR_CREDENTIALS}.`,
    }

    return (
      <ErrorModal
        heading={heading}
        description={`${message}.${retryMessage}`}
        error={error ?? placeholderError}
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
