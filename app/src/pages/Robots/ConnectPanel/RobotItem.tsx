// @flow
// connected component for an item in a RobotList
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { withRouter, type ContextRouter } from 'react-router-dom'

import {
  actions as RobotActions,
  selectors as RobotSelectors,
} from '../../../redux/robot'
import { getBuildrootUpdateAvailable, UPGRADE } from '../../../redux/buildroot'
import { CONNECTABLE } from '../../../redux/discovery'
import { RobotListItem } from './RobotListItem.js'

import type { State, Dispatch } from '../../../redux/types'
import type { ViewableRobot } from '../../../redux/discovery/types'

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
  const isConnected = robot.connected
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
        isLocal: Boolean(isLocal),
        isConnected,
        onToggleConnect: handleToggleConnect,
      }}
    />
  )
}
