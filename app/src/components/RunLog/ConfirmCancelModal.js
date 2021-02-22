// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { AlertModal } from '@opentrons/components'

import { actions as robotActions } from '../../redux/robot'
import { Portal } from '../portal'

import type { Dispatch } from '../../redux/types'

const HEADING = 'Are you sure you want to cancel this run?'
const CANCEL_TEXT = 'cancel run'
const BACK_TEXT = 'go back'

export type ConfirmCancelModalProps = {|
  onClose: () => mixed,
|}

export function ConfirmCancelModal(props: ConfirmCancelModalProps): React.Node {
  const { onClose } = props
  const dispatch = useDispatch<Dispatch>()

  const cancel = () => {
    dispatch(robotActions.cancel())
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
        <p>Doing so will terminate this run and home your robot.</p>
        <p>
          Additionally, any hardware modules used within the protocol will
          remain active and maintain their current states until deactivated.
        </p>
      </AlertModal>
    </Portal>
  )
}
