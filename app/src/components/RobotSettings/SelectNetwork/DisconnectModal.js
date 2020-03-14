// @flow
import * as React from 'react'

import { AlertModal } from '@opentrons/components'
import * as Copy from './i18n'

export type DisconnectModalProps = {|
  ssid: string,
  onDisconnect: () => mixed,
  onCancel: () => mixed,
|}

export const DisconnectModal = ({
  ssid,
  onDisconnect,
  onCancel,
}: DisconnectModalProps) => (
  <AlertModal
    alertOverlay
    iconName="wifi"
    heading={Copy.DISCONNECT_FROM_SSID(ssid)}
    onCloseClick={onCancel}
    buttons={[
      { children: Copy.CANCEL, onClick: onCancel },
      { children: Copy.DISCONNECT, onClick: onDisconnect },
    ]}
  >
    {Copy.ARE_YOU_SURE_YOU_WANT_TO_DISCONNECT(ssid)}
  </AlertModal>
)
