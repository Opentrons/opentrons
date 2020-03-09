// @flow

import * as React from 'react'

import { AlertModal } from '@opentrons/components'
import { Portal } from '../../portal'

export type DisconnectModalProps = {|
  ssid: string,
  onDisconnect: () => mixed,
  onCancel: () => mixed,
|}

// TODO(mc, 2020-03-04): i18n
const CANCEL = 'cancel'
const DISCONNECT = 'disconnect'
const formatHeading = ssid => `Disconnect from ${ssid}`
const formatMessage = ssid =>
  `Are you sure you want to disconnect from ${ssid}?`

export const DisconnectModalComponent = ({
  ssid,
  onDisconnect,
  onCancel,
}: DisconnectModalProps) => (
  <AlertModal
    alertOverlay
    iconName="wifi"
    heading={formatHeading(ssid)}
    onCloseClick={onCancel}
    buttons={[
      { children: CANCEL, onClick: onCancel },
      { children: DISCONNECT, onClick: onDisconnect },
    ]}
  >
    {formatMessage(ssid)}
  </AlertModal>
)

export const DisconnectModal = (props: DisconnectModalProps) => (
  <Portal>
    <DisconnectModalComponent {...props} />
  </Portal>
)
