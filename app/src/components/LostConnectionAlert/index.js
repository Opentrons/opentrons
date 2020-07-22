// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import { actions as robotActions } from '../../robot'
import { getAllRobots, CONNECTABLE } from '../../discovery'
import { AlertModal } from '@opentrons/components'
import { Portal } from '../portal'
import { ModalCopy } from './ModalCopy'

import type { State, Dispatch } from '../../types'

export function LostConnectionAlert(): React.Node {
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  // TODO(mc, 2020-05-07): move LostConnectionAlert into `state.alerts`
  const showAlert = useSelector((state: State) => {
    // search _all_ robots, not just connectable ones, in case we were connected
    // and then robot became not connectable
    const robot = getAllRobots(state).find(r => r.connected)
    const robotDown = robot?.status !== CONNECTABLE
    const unexpectedDisconnect = state.robot.connection.unexpectedDisconnect

    return Boolean(robot && robotDown && unexpectedDisconnect)
  })

  const disconnect = () => {
    history.push('/robots')
    dispatch(robotActions.disconnect())
  }

  return (
    showAlert && (
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
    )
  )
}
