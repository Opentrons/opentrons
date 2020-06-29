// @flow
// AlertModal for failed connection to robot
import { AlertModal } from '@opentrons/components'
import * as React from 'react'

import { Portal } from '../portal'
export type ConnectAlertModalProps = {|
  onCloseClick: () => mixed,
|}

const HEADING = 'Could not connect to robot'

const TRY_AGAIN_MESSAGE =
  'If this problem persists, we recommend restarting your robot and waiting 30 seconds before trying again. '

const CONTACT_SUPPORT_MESSAGE =
  "If you're still unable to connect, please contact our support team"

export function ConnectAlertModal(props: ConnectAlertModalProps): React.Node {
  const { onCloseClick } = props

  return (
    <Portal>
      <AlertModal
        heading={HEADING}
        onCloseClick={onCloseClick}
        buttons={[{ onClick: onCloseClick, children: 'close' }]}
        alertOverlay
      >
        <p>
          {TRY_AGAIN_MESSAGE}
          {CONTACT_SUPPORT_MESSAGE}
        </p>
      </AlertModal>
    </Portal>
  )
}
