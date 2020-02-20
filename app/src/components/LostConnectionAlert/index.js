// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { push } from 'connected-react-router'
import find from 'lodash/find'

import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../robot'
import { getAllRobots } from '../../discovery'
import { AlertModal } from '@opentrons/components'
import { Portal } from '../portal'
import { ModalCopy } from './ModalCopy'

import type { ContextRouter } from 'react-router-dom'
import type { State, Dispatch } from '../../types'

type OP = ContextRouter
type SP = {| ok: ?boolean |}
type DP = {| disconnect: () => mixed |}
type Props = {| ...OP, ...SP, ...DP |}

export const LostConnectionAlert = withRouter<_, _>(
  connect<Props, OP, SP, DP, State, Dispatch>(
    mapStateToProps,
    mapDispatchToProps
  )(LostConnectionAlertComponent)
)

function LostConnectionAlertComponent(props: Props) {
  const { ok, disconnect } = props

  return (
    ok === false && (
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

function mapStateToProps(state: State): SP {
  // search _all_ robots, not just connectable ones, in case we were connected
  // and then robot became not connectable
  const robot = find(getAllRobots(state), {
    name: robotSelectors.getConnectedRobotName(state),
  })
  const unexpectedDisconnect = state.robot.connection.unexpectedDisconnect

  return { ok: robot && robot.ok && !unexpectedDisconnect }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    disconnect: () => {
      dispatch(push('/robots'))
      dispatch(robotActions.disconnect())
    },
  }
}
