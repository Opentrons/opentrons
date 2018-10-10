// @flow
// RobotSettings card for robot status
import * as React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'

import {
  fetchHealthAndIgnored,
  makeGetRobotUpdateInfo,
} from '../../http-api-client'
import {checkShellUpdate} from '../../shell'
import {RefreshCard, LabeledValue, OutlineButton} from '@opentrons/components'
import {CardContentQuarter} from '../layout'

import type {State, Dispatch} from '../../types'
import type {RobotUpdateInfo} from '../../http-api-client'
import type {ViewableRobot} from '../../discovery'

type OwnProps = {
  robot: ViewableRobot,
  updateUrl: string,
}

type StateProps = {|
  updateInfo: RobotUpdateInfo,
|}

type DispatchProps = {|
  fetchHealth: () => mixed,
  checkAppUpdate: () => mixed,
|}

type Props = {...$Exact<OwnProps>, ...StateProps, ...DispatchProps}

const TITLE = 'Information'
const NAME_LABEL = 'Robot Name'
const SERVER_VERSION_LABEL = 'Server version'
const FIRMWARE_VERSION_LABEL = 'Firmware version'

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(InformationCard)

const getApiVersion = robot =>
  (robot.serverHealth && robot.serverHealth.apiServerVersion) ||
  (robot.health && robot.health.api_version) ||
  'unknown'

const getFirmwareVersion = robot =>
  (robot.serverHealth && robot.serverHealth.smoothieVersion) ||
  (robot.health && robot.health.fw_version) ||
  'unknown'

function InformationCard (props: Props) {
  const {robot, updateInfo, fetchHealth, updateUrl, checkAppUpdate} = props

  const {name, serverOk} = robot
  const version = getApiVersion(robot)
  const firmwareVersion = getFirmwareVersion(robot)
  const updateText = updateInfo.type || 'Reinstall'

  return (
    <RefreshCard watch={name} refresh={fetchHealth} title={TITLE}>
      <CardContentQuarter>
        <LabeledValue label={NAME_LABEL} value={name} />
      </CardContentQuarter>
      <CardContentQuarter>
        <LabeledValue label={SERVER_VERSION_LABEL} value={version} />
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

function makeMapStateToProps () {
  const getUpdateInfo = makeGetRobotUpdateInfo()

  return (state: State, ownProps: OwnProps): StateProps => ({
    updateInfo: getUpdateInfo(state, ownProps.robot),
  })
}

function mapDispatchToProps (
  dispatch: Dispatch,
  ownProps: OwnProps
): DispatchProps {
  return {
    // TODO(mc, 2018-10-10): only need to fetch ignored
    fetchHealth: () => dispatch(fetchHealthAndIgnored(ownProps.robot)),
    checkAppUpdate: () => dispatch(checkShellUpdate()),
  }
}
