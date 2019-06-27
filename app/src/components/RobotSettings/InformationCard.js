// @flow
// RobotSettings card for robot status
import * as React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import {
  fetchHealthAndIgnored,
  makeGetRobotUpdateInfo,
} from '../../http-api-client'
import { getConfig } from '../../config'
import { getRobotFirmwareVersion } from '../../discovery'
import {
  checkShellUpdate,
  getUpdateInfo as getBuildrootUpdateInfo,
} from '../../shell'

import { RefreshCard, LabeledValue, OutlineButton } from '@opentrons/components'
import { CardContentQuarter } from '../layout'

import type { State, Dispatch } from '../../types'
import type { RobotUpdateInfo } from '../../http-api-client'
import type { ViewableRobot } from '../../discovery'

type OP = {|
  appVersion: string,
  robotVersion: string,
  robot: ViewableRobot,
  updateUrl: string,
  robotVersion: string,
|}

type SP = {|
  updateInfo: RobotUpdateInfo,
|}

type DP = {|
  fetchHealth: () => mixed,
  checkAppUpdate: () => mixed,
|}

type Props = { ...OP, ...SP, ...DP }

const TITLE = 'Information'
const NAME_LABEL = 'Robot name'
const SERVER_VERSION_LABEL = 'Server version'
const FIRMWARE_VERSION_LABEL = 'Firmware version'

export default connect<Props, OP, SP, _, _, _>(
  makeMapStateToProps,
  mapDispatchToProps
)(InformationCard)

function InformationCard(props: Props) {
  const {
    robot,
    updateInfo,
    fetchHealth,
    updateUrl,
    checkAppUpdate,
    robotVersion,
  } = props
  const { name, displayName, serverOk } = robot
  const firmwareVersion = getRobotFirmwareVersion(robot) || 'Unknown'
  const updateText = updateInfo.type || 'Reinstall'

  return (
    <RefreshCard watch={name} refresh={fetchHealth} title={TITLE}>
      <CardContentQuarter>
        <LabeledValue label={NAME_LABEL} value={displayName} />
      </CardContentQuarter>
      <CardContentQuarter>
        <LabeledValue label={SERVER_VERSION_LABEL} value={robotVersion} />
      </CardContentQuarter>
      <CardContentQuarter>
        <LabeledValue label={FIRMWARE_VERSION_LABEL} value={firmwareVersion} />
      </CardContentQuarter>
      <CardContentQuarter>
        <OutlineButton
          Component={Link}
          to={updateUrl}
          onClick={checkAppUpdate}
          disabled={!serverOk}
        >
          {updateText}
        </OutlineButton>
      </CardContentQuarter>
    </RefreshCard>
  )
}

function makeMapStateToProps(): (state: State, ownProps: OP) => SP {
  const getRobotUpdateInfo = makeGetRobotUpdateInfo()

  return (state, ownProps) => {
    const __buildrootEnabled = Boolean(
      getConfig(state).devInternal?.enableBuildRoot
    )
    const updateInfo = __buildrootEnabled
      ? getBuildrootUpdateInfo(ownProps.appVersion, ownProps.robotVersion)
      : getRobotUpdateInfo(state, ownProps.robot)
    return {
      updateInfo,
    }
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    // TODO(mc, 2018-10-10): only need to fetch ignored
    fetchHealth: () => dispatch(fetchHealthAndIgnored(ownProps.robot)),
    checkAppUpdate: () => dispatch(checkShellUpdate()),
  }
}
