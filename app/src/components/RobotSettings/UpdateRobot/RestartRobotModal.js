// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

import {
  restartRobotServer,
  clearUpdateResponse,
} from '../../../http-api-client'
import { AlertModal } from '@opentrons/components'

import type { Dispatch } from '../../../types'
import type { ViewableRobot } from '../../../discovery'

type OP = {| robot: ViewableRobot |}

type DP = {| restart: () => mixed, close: () => mixed |}

type Props = { ...OP, ...DP }

export default connect<Props, OP, {||}, DP, _, _>(
  null,
  mapDispatchToProps
)(RestartRobotModal)

// TODO (ka 2018-11-27): Clarify heading and messaging with UX
const RESTART_HEADING = 'Update installed'

function RestartRobotModal(props: Props) {
  return (
    <AlertModal
      heading={RESTART_HEADING}
      buttons={[
        { onClick: props.close, children: 'not now' },
        { onClick: props.restart, children: 'restart' },
      ]}
      alertOverlay
    >
      Restart your robot to finish the update. It may take several minutes for
      your robot to restart.
    </AlertModal>
  )
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { robot } = ownProps

  const close = () => dispatch(push(`/robots/${robot.name}`))

  return {
    close,
    restart: () => {
      dispatch(restartRobotServer(robot))
        .then(() => dispatch(clearUpdateResponse(robot)))
        .then(close)
    },
  }
}
