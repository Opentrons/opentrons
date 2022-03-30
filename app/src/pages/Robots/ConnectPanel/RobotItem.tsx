// connected component for an item in a RobotList
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { connect, disconnect } from '../../../redux/robot'
import { getBuildrootUpdateAvailable, UPGRADE } from '../../../redux/buildroot'
import { CONNECTABLE } from '../../../redux/discovery'
import { RobotListItem } from './RobotListItem'

import type { RouteComponentProps } from 'react-router-dom'
import type { State, Dispatch } from '../../../redux/types'
import type { ViewableRobot } from '../../../redux/discovery/types'

export interface RobotItemProps extends RouteComponentProps<{ name: string }> {
  robot: ViewableRobot
}

export const RobotItem = withRouter(RobotItemComponent)

export function RobotItemComponent(props: RobotItemProps): JSX.Element {
  const { robot, match } = props
  const { name, displayName, status, local: isLocal } = robot
  const isUpgradable = useSelector((state: State) => {
    return getBuildrootUpdateAvailable(state, robot) === UPGRADE
  })
  const isConnectable = status === CONNECTABLE
  const isConnected = robot.connected
  const isSelected = robot.name === match.params.name
  const dispatch = useDispatch<Dispatch>()

  // TODO(mc, 2022-03-07): consolidate into a `useToggleConnect` hook;
  // see app/src/pages/Robots/RobotSettings/StatusCard.tsx
  const handleToggleConnect = (): void => {
    const action = isConnected ? disconnect() : connect(name)

    dispatch(action)
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
