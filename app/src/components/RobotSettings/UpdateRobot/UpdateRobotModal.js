// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { push } from 'react-router-redux'

import {
  updateRobotServer,
  makeGetRobotUpdateInfo,
  setIgnoredUpdate,
} from '../../../http-api-client'

import { getRobotApiVersion } from '../../../discovery'

import { CURRENT_VERSION } from '../../../shell'

import UpdateAppModal from './UpdateAppModal'
import SyncRobotModal from './SyncRobotModal'
import ReinstallModal from './ReinstallModal'

import type { State, Dispatch } from '../../../types'
import type { ShellUpdateState } from '../../../shell'
import type { ViewableRobot } from '../../../discovery'
import type { RobotUpdateInfo } from '../../../http-api-client'

type OP = {| robot: ViewableRobot, appUpdate: ShellUpdateState |}

type SP = {|
  appVersion: string,
  robotVersion: string,
  robotUpdateInfo: RobotUpdateInfo,
|}

type DP = {| dispatch: Dispatch |}

type Props = {
  ...OP,
  ...SP,
  parentUrl: string,
  ignoreUpdate: () => mixed,
  update: () => mixed,
}

type UpdateRobotState = {
  ignoreAppUpdate: boolean,
}

class UpdateRobotModal extends React.Component<Props, UpdateRobotState> {
  constructor(props: Props) {
    super(props)
    this.state = { ignoreAppUpdate: false }
  }

  setIgnoreAppUpdate = () => {
    this.setState({ ignoreAppUpdate: true })
  }

  render() {
    const {
      parentUrl,
      appVersion,
      robotVersion,
      robotUpdateInfo,
      appUpdate: { available: appUpdateAvailable, info: appUpdateInfo },
    } = this.props
    const { ignoreAppUpdate } = this.state
    const appUpdateVersion = appUpdateInfo && appUpdateInfo.version
    const robotUpdateVersion = robotUpdateInfo.version
    const availableUpdate = appUpdateVersion || robotUpdateVersion
    const versionProps = { appVersion, robotVersion, availableUpdate }
    const isUpgrade = robotUpdateInfo.type === 'upgrade'
    const onClick = isUpgrade ? this.setIgnoreAppUpdate : this.props.update

    if (appUpdateAvailable && !ignoreAppUpdate) {
      return (
        <UpdateAppModal
          updateInfo={robotUpdateInfo}
          parentUrl={parentUrl}
          onClick={onClick}
          versionProps={versionProps}
          ignoreUpdate={this.props.ignoreUpdate}
        />
      )
    } else if (robotUpdateInfo.type) {
      return (
        <SyncRobotModal
          updateInfo={robotUpdateInfo}
          parentUrl={parentUrl}
          versionProps={versionProps}
          update={this.props.update}
          ignoreUpdate={this.props.ignoreUpdate}
          showReleaseNotes={isUpgrade && ignoreAppUpdate}
        />
      )
    } else {
      return <ReinstallModal {...this.props} versionProps={versionProps} />
    }
  }
}

function makeMapStateToProps(): (State, OP) => SP {
  const getRobotUpdateInfo = makeGetRobotUpdateInfo()

  return (state, ownProps) => ({
    appVersion: CURRENT_VERSION,
    robotVersion: getRobotApiVersion(ownProps.robot) || 'Unknown',
    robotUpdateInfo: getRobotUpdateInfo(state, ownProps.robot),
  })
}

function mergeProps(stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const { robot } = ownProps
  const { robotUpdateInfo } = stateProps
  const { dispatch } = dispatchProps
  const parentUrl = `/robots/${robot.name}`
  const close = () => dispatch(push(parentUrl))
  let ignoreUpdate = robotUpdateInfo.type
    ? () =>
        dispatch(setIgnoredUpdate(robot, robotUpdateInfo.version)).then(close)
    : close

  return {
    ...ownProps,
    ...stateProps,
    parentUrl,
    ignoreUpdate,
    update: () => dispatch(updateRobotServer(robot)),
  }
}

export default connect<Props, OP, SP, {||}, State, Dispatch>(
  makeMapStateToProps,
  null,
  mergeProps
)(UpdateRobotModal)
