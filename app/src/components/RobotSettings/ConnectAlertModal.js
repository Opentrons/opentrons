// @flow
// AlertModal for failed connection to robot
import * as React from 'react'

import {AlertModal} from '@opentrons/components'

type Props = {
  onCloseClick: () => *
}

const HEADING = 'Could not connect to robot'

const TRY_AGAIN_MESSAGE = 'If this problem persists, we recommend restarting your robot and waiting 30 seconds before trying again. '

const CONTACT_SUPPORT_MESSAGE = "If you're still unable to connect, please contact our support team"

export default function ConnectAlertModal (props: Props) {
  const {onCloseClick} = props

  return (
    <AlertModal
      heading={HEADING}
      onCloseClick={onCloseClick}
      buttons={[
        {onClick: onCloseClick, children: 'close'}
      ]}
    >
      <p>
        {TRY_AGAIN_MESSAGE}
        {CONTACT_SUPPORT_MESSAGE}
      </p>
    </AlertModal>
  )
}
