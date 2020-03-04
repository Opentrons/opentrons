// @flow

import * as React from 'react'

import { SpinnerModal } from '@opentrons/components'
import { Portal } from '../../portal'
import { DISCONNECT } from './constants'

import type { NetworkChangeType } from './types'

export type InProgressModalProps = {|
  type: NetworkChangeType,
  ssid: string | null,
|}

// TODO(mc, 2020-03-04): i18n
const CONNECTING_TO_NETWORK = 'Connecting to network'
const DISCONNECTING_FROM_NETWORK = 'Disconnecting from network'

export const InProgressModalComponent = (props: InProgressModalProps) => (
  <SpinnerModal alertOverlay message={formatMessage(props)} />
)

export const InProgressModal = (props: InProgressModalProps) => (
  <Portal>
    <InProgressModalComponent {...props} />
  </Portal>
)

const formatMessage = ({ type, ssid }: InProgressModalProps) => {
  const ssidSuffix = ssid != null ? ` ${ssid}` : ''
  const actionPrefix =
    type === DISCONNECT ? DISCONNECTING_FROM_NETWORK : CONNECTING_TO_NETWORK

  return `${actionPrefix}${ssidSuffix}`
}
