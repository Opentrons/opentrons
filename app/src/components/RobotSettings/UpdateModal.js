// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import {
  updateRobotServer,
  restartRobotServer,
  makeGetAvailableRobotUpdate
} from '../../http-api-client'

import {AlertModal} from '@opentrons/components'

type OwnProps = Robot

type StateProps = {
  availableUpdate: string
}

type DispatchProps = {
  close: () => *,
  update: () => *,
  restart: () => *
}

type Props = StateProps & DispatchProps

export default connect(makeMapStateToProps, mapDispatchToProps)(UpdateModal)

function UpdateModal (props: Props) {
  const {availableUpdate, close, update, restart} = props

  // TODO(mc, 2018-03-18): switch based on request state (why `let` vs `const`)
  let message = "We recommend updating your robot's software to the latest version"
  let buttonText = 'update'
  let buttonAction = update

  return (
    <AlertModal
      onCloseClick={close}
      heading={`Version ${availableUpdate} Available`}
      buttons={[
        {onClick: close, children: 'not now'},
        {onClick: buttonAction, children: buttonText},
        // TODO (mc, 2018-03-18): remove restart and make buttonAction dynamic
        {onClick: restart, children: 'restart'}
      ]}
    >
      {message}
    </AlertModal>
  )
}

function makeMapStateToProps () {
  const getAvailableRobotUpdate = makeGetAvailableRobotUpdate()

  return (state: State, ownProps: OwnProps): StateProps => ({
    availableUpdate: getAvailableRobotUpdate(state, ownProps)
  })
}

function mapDispatchToProps (
  dispatch: Dispatch,
  ownProps: OwnProps
): DispatchProps {
  const close = () => dispatch(push(`/robots/${ownProps.name}`))

  return {
    close,
    update: () => dispatch(updateRobotServer(ownProps)),
    restart: () => dispatch(restartRobotServer(ownProps)).then(close)
  }
}
