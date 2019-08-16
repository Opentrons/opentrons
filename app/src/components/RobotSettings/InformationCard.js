// @flow
// RobotSettings card for robot status
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import { getRobotApiVersion, getRobotFirmwareVersion } from '../../discovery'

import {
  getBuildrootRobot,
  checkShellUpdate,
  compareRobotVersionToUpdate,
} from '../../shell'

import {
  Card,
  LabeledValue,
  OutlineButton,
  HoverTooltip,
  useInterval,
} from '@opentrons/components'

import { CardContentQuarter } from '../layout'

import type { Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery'

type Props = {|
  robot: ViewableRobot,
  updateUrl: string,
|}

const TITLE = 'Information'
const NAME_LABEL = 'Robot name'
const SERVER_VERSION_LABEL = 'Server version'
const FIRMWARE_VERSION_LABEL = 'Firmware version'

const UPDATE_SERVER_UNAVAILABLE =
  "Unable to update because your robot's update server is not responding"
const OTHER_ROBOT_UPDATING =
  'Unable to update because your app is currently updating a different robot'

const UPDATE_RECHECK_DELAY_MS = 60000

export default function InformationCard(props: Props) {
  const { robot, updateUrl } = props
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])

  const { displayName, serverOk } = robot
  const buildrootRobot = useSelector(getBuildrootRobot)

  const version = getRobotApiVersion(robot)
  const firmwareVersion = getRobotFirmwareVersion(robot)

  const updateServerUnavailable = !serverOk
  const otherRobotUpdating = Boolean(buildrootRobot && buildrootRobot !== robot)
  const updateDisabled = updateServerUnavailable || otherRobotUpdating

  const updateButtonText = compareRobotVersionToUpdate(robot)

  const updateButtonTooltip = updateDisabled ? (
    <span>
      {updateServerUnavailable
        ? UPDATE_SERVER_UNAVAILABLE
        : OTHER_ROBOT_UPDATING}
    </span>
  ) : null

  // check for available updates on an interval
  useInterval(checkAppUpdate, UPDATE_RECHECK_DELAY_MS)

  return (
    <Card title={TITLE}>
      <CardContentQuarter>
        <LabeledValue label={NAME_LABEL} value={displayName} />
      </CardContentQuarter>
      <CardContentQuarter>
        <LabeledValue
          label={SERVER_VERSION_LABEL}
          value={version || 'Unknown'}
        />
      </CardContentQuarter>
      <CardContentQuarter>
        <LabeledValue
          label={FIRMWARE_VERSION_LABEL}
          value={firmwareVersion || 'Unknown'}
        />
      </CardContentQuarter>
      <CardContentQuarter>
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
      </CardContentQuarter>
    </Card>
  )
}
