import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import {
  actions as robotActions,
  selectors as robotSel,
} from '../../../redux/robot'
import { getConnectedRobot, CONNECTABLE } from '../../../redux/discovery'
import { AlertModal } from '@opentrons/components'
import { Portal } from '../../../App/portal'
import { ModalCopy } from './ModalCopy'

import type { State, Dispatch } from '../../../redux/types'

export function LostConnectionAlert(): JSX.Element | null {
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  // TODO(mc, 2020-05-07): move LostConnectionAlert into `state.alerts`
  const showAlert = useSelector((state: State) => {
    const connectedName = robotSel.getConnectedRobotName(state)
    const connectedRobot = getConnectedRobot(state)
    const robotDown = connectedRobot?.status !== CONNECTABLE
    const unexpectedDisconnect = state.robot.connection.unexpectedDisconnect

    // trigger an alert if we're supposed to be connected but the robot is down
    // or if the WebSocket closed unexpectedly
    return Boolean((connectedName && robotDown) || unexpectedDisconnect)
  })

  const disconnect = (): void => {
    history.push('/robots')
    dispatch(robotActions.disconnect())
  }

  return showAlert ? (
    <Portal>
      <AlertModal
        onCloseClick={disconnect}
        heading={'Connection to robot lost'}
        buttons={[{ onClick: disconnect, children: 'close' }]}
        alertOverlay
      >
        <ModalCopy />
      </AlertModal>
    </Portal>
  ) : null
}
