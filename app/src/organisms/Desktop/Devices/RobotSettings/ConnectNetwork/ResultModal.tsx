import { useTranslation } from 'react-i18next'

import { AlertModal, SpinnerModal } from '@opentrons/components'

import { ErrorModal } from '/app/molecules/modals'

import { DISCONNECT } from './constants'

import type { ReactNode } from 'react'
import type { NetworkChangeType } from './types'

export interface ResultModalProps {
  type: NetworkChangeType
  ssid: string | null
  isPending: boolean
  isError: boolean
  error: { message?: string; [key: string]: unknown } | null
  onClose: () => unknown
}

export const ResultModal = (props: ResultModalProps): ReactNode => {
  const { type, ssid, isPending, isError, error, onClose } = props
  const { t } = useTranslation(['device_settings', 'shared'])
  const isDisconnect = type === DISCONNECT

  if (isPending) {
    const message = isDisconnect
      ? t('disconnecting_from_wifi_network', { ssid: ssid })
      : t('connecting_to_wifi_network', { ssid: ssid })

    return <SpinnerModal alertOverlay message={message} />
  }

  if (isError || error != null) {
    const heading = isDisconnect
      ? t('unable_to_disconnect')
      : t('unable_to_connect')

    const message = isDisconnect
      ? t('disconnect_from_wifi_network_failure', { ssid: ssid })
      : t('connect_to_wifi_network_failure', { ssid: ssid })

    const retryMessage = !isDisconnect ? t('please_check_credentials') : ''

    const placeholderError = {
      message: `${t('likely_incorrect_password')} ${t(
        'please_check_credentials'
      )}.`,
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
    ? t('successfully_disconnected')
    : t('successfully_connected_to_wifi')

  const message = isDisconnect
    ? t('disconnect_from_wifi_network_success')
    : t('successfully_connected_to_ssid', { ssid: ssid })

  return (
    <AlertModal
      alertOverlay
      iconName="wifi"
      heading={heading}
      onCloseClick={props.onClose}
      buttons={[{ children: t('shared:close'), onClick: onClose }]}
    >
      {message}
    </AlertModal>
  )
}
