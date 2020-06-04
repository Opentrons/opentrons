// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { push } from 'connected-react-router'
import { AlertModal } from '@opentrons/components'

import type { Dispatch } from '../../types'
import { actions as robotActions } from '../../robot'

const HEADING = 'Are you sure you want to cancel this run?'
const CANCEL_TEXT = 'cancel run'
const BACK_TEXT = 'go back'

export function ConfirmCancelModal(): React.Node {
  const dispatch = useDispatch<Dispatch>()
  const back = () => {
    dispatch(robotActions.resume())
    dispatch(push('/run'))
  }
  const cancel = () => {
    dispatch(robotActions.cancel())
    dispatch(push('/run'))
  }

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        { children: BACK_TEXT, onClick: back },
        { children: CANCEL_TEXT, onClick: cancel },
      ]}
      alertOverlay
    >
      <p>Doing so will terminate this run and home your robot.</p>
      <p>
        Additionally, any hardware modules used within the protocol will remain
        active and maintain their current states until deactivated.
      </p>
    </AlertModal>
  )
}
