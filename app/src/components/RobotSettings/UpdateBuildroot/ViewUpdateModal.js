// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'

import { getRobotBuildrootStatus } from '../../../discovery'
import { getBuildrootUpdateInfo, setBuildrootUpdateSeen } from '../../../shell'
import { makeGetRobotUpdateInfo } from '../../../http-api-client'

import SystemUpdateModal from './SystemUpdateModal'
import ReleaseNotesModal from './ReleaseNotesModal'

import type { State, Dispatch } from '../../../types'
import type { ViewableRobot, BuildrootStatus } from '../../../discovery'
import type { BuildrootUpdateInfo } from '../../../shell'
import type { RobotUpdateInfo } from '../../../http-api-client'

type OP = {|
  robot: ViewableRobot,
  parentUrl: string,
|}

type SP = {|
  buildrootStatus: BuildrootStatus | null,
  buildrootUpdateInfo: BuildrootUpdateInfo | null,
  robotUpdateInfo: RobotUpdateInfo,
|}

type DP = {| dispatch: Dispatch |}

type Props = { ...OP, ...SP, ignoreUpdate: () => mixed }

function ViewUpdateModal(props: Props) {
  const [showReleaseNotes, setShowReleaseNotes] = React.useState<boolean>(false)
  const viewReleaseNotes = () => setShowReleaseNotes(true)
  const {
    buildrootStatus,
    ignoreUpdate,
    robotUpdateInfo,
    buildrootUpdateInfo,
  } = props
  // TODO (ka 2019-7-10): This does not need to be a link or remove merge props
  const notNowButton = {
    onClick: ignoreUpdate,
    children: 'not now',
  }

  if (buildrootStatus === 'balena' && !showReleaseNotes) {
    return (
      <SystemUpdateModal
        notNowButton={notNowButton}
        viewReleaseNotes={viewReleaseNotes}
      />
    )
  } else if (showReleaseNotes && robotUpdateInfo.type === 'upgrade') {
    return (
      <ReleaseNotesModal
        notNowButton={notNowButton}
        releaseNotes={buildrootUpdateInfo?.releaseNotes}
      />
    )
  }

  return null
}

function mapStateToProps(): (state: State, ownProps: OP) => SP {
  const getRobotUpdateInfo = makeGetRobotUpdateInfo()
  return (state, ownProps) => ({
    buildrootStatus: getRobotBuildrootStatus(ownProps.robot),
    buildrootUpdateInfo: getBuildrootUpdateInfo(state),
    robotUpdateInfo: getRobotUpdateInfo(state, ownProps.robot),
  })
}

// TODO (ka 2019-7-10): This is identical to UpdateRobotModal,
// consider moving this up to index
function mergeProps(stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const { parentUrl } = ownProps
  const { robotUpdateInfo } = stateProps
  const { dispatch } = dispatchProps
  const close = () => dispatch(push(parentUrl))
  let ignoreUpdate = robotUpdateInfo.type
    ? () => {
        dispatch(setBuildrootUpdateSeen())
        close()
      }
    : close

  return {
    ...ownProps,
    ...stateProps,
    ignoreUpdate,
  }
}

export default connect<Props, OP, SP, {||}, State, Dispatch>(
  mapStateToProps,
  null,
  mergeProps
)(ViewUpdateModal)
