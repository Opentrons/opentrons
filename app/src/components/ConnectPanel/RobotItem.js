// @flow
// connected component for an item in a RobotList
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { type ContextRouter, withRouter } from 'react-router-dom'

import { getBuildrootUpdateAvailable, UPGRADE } from '../../buildroot'
import { CONNECTABLE } from '../../discovery'
import type { ViewableRobot } from '../../discovery/types'
import {
  actions as RobotActions,
  selectors as RobotSelectors,
} from '../../robot'
import type { Dispatch, State } from '../../types'
import { RobotListItem } from './RobotListItem.js'

export type RobotItemProps = {|
  ...ContextRouter,
  robot: ViewableRobot,
|}

export const RobotItem: React.AbstractComponent<
  $Diff<RobotItemProps, ContextRouter>
> = withRouter(RobotItemComponent)

export function RobotItemComponent(props: RobotItemProps): React.Node {
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
