import * as React from 'react'
import { AlertModal } from '@opentrons/components'

import { Portal } from '../../../App/portal'
import { useCurrentRunControls } from './hooks'

const HEADING = 'Are you sure you want to cancel this run?'
const CANCEL_TEXT = 'yes, cancel run'
const BACK_TEXT = 'no, go back'

export interface ConfirmCancelModalProps {
  onClose: () => unknown
}

export function ConfirmCancelModal(
  props: ConfirmCancelModalProps
): JSX.Element {
  const { onClose } = props
  const { stopRun } = useCurrentRunControls()

  const cancel = (): void => {
    stopRun()
    onClose()
  }

  return (
    <Portal>
      <AlertModal
        heading={HEADING}
        buttons={[
          { children: BACK_TEXT, onClick: onClose },
          { children: CANCEL_TEXT, onClick: cancel },
        ]}
        alertOverlay
      >
        <p>
          Doing so will terminate this run, drop any attached tips in the trash
          container and home your robot.
        </p>
        <p>
          Additionally, any hardware modules used within the protocol will
          remain active and maintain their current states until deactivated.
        </p>
      </AlertModal>
    </Portal>
  )
}
