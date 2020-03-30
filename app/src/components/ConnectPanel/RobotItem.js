// @flow
// connected component for an item in a RobotList
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { withRouter, type ContextRouter } from 'react-router-dom'

import {
  actions as RobotActions,
  selectors as RobotSelectors,
} from '../../robot'
import { getBuildrootUpdateAvailable, UPGRADE } from '../../buildroot'
import { CONNECTABLE } from '../../discovery'
import { RobotListItem } from './RobotListItem.js'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

export type RobotItemProps = {|
  robot: ViewableRobot,
|}

export const RobotItem = withRouter<_, _>(RobotItemComponent)

export function RobotItemComponent(props: {|
  ...ContextRouter,
  ...RobotItemProps,
|}) {
  const { robot, match } = props
  const { name, displayName, status, local: isLocal } = robot
  const isUpgradable = useSelector((state: State) => {
    return getBuildrootUpdateAvailable(state, robot) === UPGRADE
  })
  const isConnectable = status === CONNECTABLE
  // NOTE(mc, 2020-03-30): redundant && true to satisfy Flow
  const isConnected = Boolean(robot.connected && true)
  const isSelected = robot.name === match.params.name
  const connectInProgress = useSelector(
    (state: State) => RobotSelectors.getConnectRequest(state).inProgress
  )
  const dispatch = useDispatch<Dispatch>()

  const handleToggleConnect = () => {
    if (!connectInProgress) {
      const action = isConnected
        ? RobotActions.disconnect()
        : RobotActions.connect(name)

      dispatch(action)
    }
  }

  return (
    <RobotListItem
      {...{
        name,
        displayName,
        isConnectable,
        isUpgradable,
        isSelected,
        isLocal,
        isConnected,
        onToggleConnect: handleToggleConnect,
      }}
    />
  )
}
