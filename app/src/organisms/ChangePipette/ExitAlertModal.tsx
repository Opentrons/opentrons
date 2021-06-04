import * as React from 'react'

import { AlertModal } from '@opentrons/components'
import { Portal } from '../../App/portal'

interface Props {
  back: () => unknown
  exit: () => unknown
}

// TODO(mc, 2019-12-18): i18n
const ARE_YOU_SURE_YOU_WANT_TO_GO_BACK = 'Are you sure you want to go back?'
const EXITING_WILL_END_PIPETTE_SETUP =
  'Exiting will end pipette setup and home your robot.'
const CANCEL = 'cancel'
const EXIT = 'exit'

export function ExitAlertModal(props: Props): JSX.Element {
  const { back, exit } = props

  return (
    <Portal level="top">
      <AlertModal
        heading={ARE_YOU_SURE_YOU_WANT_TO_GO_BACK}
        buttons={[
          { children: CANCEL, onClick: back },
          { children: EXIT, onClick: exit },
        ]}
        alertOverlay
      >
        <p>{EXITING_WILL_END_PIPETTE_SETUP}</p>
      </AlertModal>
    </Portal>
  )
}
