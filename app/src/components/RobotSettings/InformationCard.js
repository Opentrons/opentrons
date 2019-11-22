// @flow
// RobotSettings card for robot status
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import {
  getRobotApiVersion,
  getRobotFirmwareVersion,
  getRobotProtocolApiVersion,
} from '../../discovery'

import {
  getBuildrootRobot,
  checkShellUpdate,
  getBuildrootUpdateAvailable,
} from '../../shell'

import {
  Card,
  LabeledValue,
  OutlineButton,
  HoverTooltip,
  useInterval,
} from '@opentrons/components'

import { CardContentThird } from '../layout'

import type { Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

type Props = {|
  robot: ViewableRobot,
  updateUrl: string,
|}

const TITLE = 'Information'
const NAME_LABEL = 'Robot name'
const SERVER_VERSION_LABEL = 'Server version'
const FIRMWARE_VERSION_LABEL = 'Firmware version'
const MAX_API_VERSION_LABEL = 'Max API Version'

const UPDATE_SERVER_UNAVAILABLE =
  "Unable to update because your robot's update server is not responding"
const OTHER_ROBOT_UPDATING =
  'Unable to update because your app is currently updating a different robot'
const NO_UPDATE_FILES =
  'No robot update files found for this version of the app; please check again later'

const UPDATE_RECHECK_DELAY_MS = 60000

export default function InformationCard(props: Props) {
  const { robot, updateUrl } = props
  const updateType = useSelector(state =>
    getBuildrootUpdateAvailable(state, robot)
  )
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])

  const { displayName, serverOk } = robot
  const buildrootRobot = useSelector(getBuildrootRobot)
  const version = getRobotApiVersion(robot)
  const firmwareVersion = getRobotFirmwareVersion(robot)
  const protocolApiVersion = getRobotProtocolApiVersion(robot)
  const formattedProtocolApiVersion = protocolApiVersion
    ? `${protocolApiVersion[0]}.${protocolApiVersion[1]}`
    : null

  const updateFilesUnavailable = updateType === null
  const updateServerUnavailable = !serverOk
  const otherRobotUpdating = Boolean(buildrootRobot && buildrootRobot !== robot)
  const updateDisabled =
    updateFilesUnavailable || updateServerUnavailable || otherRobotUpdating

  const updateButtonText = updateType || 'up to date'
  let updateButtonTooltip = null
  if (otherRobotUpdating) {
    updateButtonTooltip = <span>{OTHER_ROBOT_UPDATING}</span>
  } else if (updateServerUnavailable) {
    updateButtonTooltip = <span>{UPDATE_SERVER_UNAVAILABLE}</span>
  } else if (updateFilesUnavailable) {
    updateButtonTooltip = <span>{NO_UPDATE_FILES}</span>
  }

  // check for available updates on an interval
  useInterval(checkAppUpdate, UPDATE_RECHECK_DELAY_MS)

  return (
    <Card title={TITLE}>
      <div>
        <CardContentThird>
          <LabeledValue label={NAME_LABEL} value={displayName} />
        </CardContentThird>
        <CardContentThird>
          <LabeledValue
            label={SERVER_VERSION_LABEL}
            value={version || 'Unknown'}
          />
        </CardContentThird>
        <CardContentThird>
          <HoverTooltip tooltipComponent={updateButtonTooltip}>
            {hoverTooltipHandlers => (
              <div {...hoverTooltipHandlers}>
                <OutlineButton
                  Component={Link}
                  to={updateUrl}
                  disabled={updateDisabled}
                >
                  {updateButtonText}
                </OutlineButton>
              </div>
            )}
          </HoverTooltip>
        </CardContentThird>
      </div>
      <div>
        <CardContentThird>
          <LabeledValue
            label={FIRMWARE_VERSION_LABEL}
            value={firmwareVersion || 'Unknown'}
          />
        </CardContentThird>
        <CardContentThird overrideLast>
          <LabeledValue
            label={MAX_API_VERSION_LABEL}
            value={formattedProtocolApiVersion || 'Unknown'}
          />
        </CardContentThird>
      </div>
    </Card>
  )
}
