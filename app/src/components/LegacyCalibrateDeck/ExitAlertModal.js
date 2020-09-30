// @flow
import * as React from 'react'

import { AlertModal } from '@opentrons/components'

export type ExitAlertModalProps = {|
  back: () => mixed,
  exit: () => mixed,
|}

const HEADING = 'Are you sure you want to exit initial robot calibration?'
const CANCEL_TEXT = 'cancel'
const EXIT_TEXT = 'exit calibration'

export function ExitAlertModal(props: ExitAlertModalProps): React.Node {
  const { back, exit } = props
  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        { children: CANCEL_TEXT, onClick: back },
        { children: EXIT_TEXT, onClick: exit },
      ]}
      alertOverlay
    >
      <p>
        Doing so will home the robot and revert to using previously saved
        calibration settings.
      </p>
    </AlertModal>
  )
}
