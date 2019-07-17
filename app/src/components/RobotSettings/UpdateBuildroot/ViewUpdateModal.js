// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'

import { getRobotBuildrootStatus } from '../../../discovery'
import {
  getBuildrootUpdateInfo,
  getBuildrootDownloadProgress,
  getBuildrootDownloadError,
  setBuildrootUpdateSeen,
} from '../../../shell'
import { makeGetRobotUpdateInfo } from '../../../http-api-client'

import SystemUpdateModal from './SystemUpdateModal'
import DownloadUpdateModal from './DownloadUpdateModal'
import ReleaseNotesModal from './ReleaseNotesModal'

import type { State, Dispatch } from '../../../types'
import type { ViewableRobot, BuildrootStatus } from '../../../discovery'
import type { BuildrootUpdateInfo } from '../../../shell'
import type { RobotUpdateInfo } from '../../../http-api-client'

type OP = {|
  robot: ViewableRobot,
  parentUrl: string,
  setCurrentStep: (step: string) => mixed,
|}

type SP = {|
  buildrootStatus: BuildrootStatus | null,
  buildrootUpdateInfo: BuildrootUpdateInfo | null,
  buildrootDownloadProgress: number | null,
  buildrootDownloadError: string | null,
  robotUpdateInfo: RobotUpdateInfo,
|}

type DP = {| dispatch: Dispatch |}

type Props = { ...OP, ...SP, ignoreUpdate: () => mixed }

function ViewUpdateModal(props: Props) {
  const [
    migrationWarningSeen,
    setMigrationWarningSeen,
  ] = React.useState<boolean>(false)

  const {
    buildrootStatus,
    ignoreUpdate,
    robotUpdateInfo,
    buildrootUpdateInfo,
    buildrootDownloadError,
    buildrootDownloadProgress,
    setCurrentStep,
  } = props
  const notNowButton = {
    onClick: ignoreUpdate,
    children: 'not now',
  }

  React.useEffect(() => {
    if (robotUpdateInfo.type !== 'upgrade' && buildrootUpdateInfo) {
      if (
        (buildrootStatus === 'balena' && migrationWarningSeen) ||
        buildrootStatus !== 'balena'
      ) {
        setCurrentStep('installUpdate')
      }
    }
  }, [
    buildrootStatus,
    buildrootUpdateInfo,
    migrationWarningSeen,
    robotUpdateInfo.type,
    setCurrentStep,
  ])

  if (buildrootStatus === 'balena' && !migrationWarningSeen) {
    return (
      <SystemUpdateModal
        notNowButton={notNowButton}
        viewReleaseNotes={() => setMigrationWarningSeen(true)}
      />
    )
  } else if (!buildrootUpdateInfo) {
    return (
      <DownloadUpdateModal
        notNowButton={notNowButton}
        error={buildrootDownloadError}
        progress={buildrootDownloadProgress}
      />
    )
  } else {
    return (
      <ReleaseNotesModal
        notNowButton={notNowButton}
        releaseNotes={buildrootUpdateInfo?.releaseNotes}
        buildrootStatus={buildrootStatus}
      />
    )
  }
}

function mapStateToProps(): (state: State, ownProps: OP) => SP {
  const getRobotUpdateInfo = makeGetRobotUpdateInfo()
  return (state, ownProps) => ({
    buildrootStatus: getRobotBuildrootStatus(ownProps.robot),
    buildrootUpdateInfo: getBuildrootUpdateInfo(state),
    buildrootDownloadProgress: getBuildrootDownloadProgress(state),
    buildrootDownloadError: getBuildrootDownloadError(state),
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
