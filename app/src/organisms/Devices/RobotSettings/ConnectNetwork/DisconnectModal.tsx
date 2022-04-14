import * as React from 'react'

import { AlertModal } from '@opentrons/components'
import * as Copy from './i18n'

export interface DisconnectModalProps {
  ssid: string
  onDisconnect: () => unknown
  onCancel: () => unknown
}

export const DisconnectModal = ({
  ssid,
  onDisconnect,
  onCancel,
}: DisconnectModalProps): JSX.Element => (
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
