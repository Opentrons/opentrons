// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'
import {push} from 'react-router-redux'
import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

import {makeGetHealthCheckOk} from '../../health-check'

import {AlertModal} from '@opentrons/components'
import {Portal} from '../portal'
import ModalCopy from './ModalCopy'

type StateProps = {
  robot: ?Robot,
  ok: ?boolean
}

type DispatchProps = {
  disconnect: () => mixed
}

type Props = StateProps & DispatchProps

export default withRouter(connect(
  makeMapStateToProps,
  mapDispatchToProps
)(LostConnectionAlert))

function LostConnectionAlert (props: Props) {
  const {ok, disconnect} = props

  return ok === false && (
    <Portal>
      <AlertModal
        onCloseClick={disconnect}
        heading={'Connection to robot lost'}
        buttons={[
          {onClick: disconnect, children: 'close'}
        ]}
        alertOverlay
      >
        <ModalCopy />
      </AlertModal>
    </Portal>
  )
}

function makeMapStateToProps () {
  const getHealthOk = makeGetHealthCheckOk()

  return (state: State) => {
    const robot = robotSelectors.getConnectedRobot(state)

    return {
      ok: robot && getHealthOk(state, robot)
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch) {
  return {
    disconnect: () => {
      dispatch(push('/robots'))
      dispatch(robotActions.disconnect())
    }
  }
}
