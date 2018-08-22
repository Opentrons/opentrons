// @flow
import * as React from 'react'

import {AlertModal} from '@opentrons/components'
import {Portal} from '../portal'

type Props = {
  back: () => mixed,
  exit: () => mixed,
}

const HEADING = 'Are you sure you want to go back?'
const CANCEL_TEXT = 'cancel'
const EXIT_TEXT = 'exit'

export default function ExitAlertModal (props: Props) {
  const {back, exit} = props

  return (
    <Portal>
      <AlertModal
        heading={HEADING}
        buttons={[
          {children: CANCEL_TEXT, onClick: back},
          {children: EXIT_TEXT, onClick: exit}
        ]}
        alertOverlay
      >
        <p>Doing so will exit pipette setup and home your robot.</p>
      </AlertModal>
    </Portal>
  )
}
