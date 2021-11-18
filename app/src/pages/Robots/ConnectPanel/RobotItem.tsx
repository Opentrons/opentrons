// connected component for an item in a RobotList
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { withRouter } from 'react-router-dom'

import {
  actions as RobotActions,
  selectors as RobotSelectors,
} from '../../../redux/robot'
import { useFeatureFlag } from '../../../redux/config'
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
  const connectInProgress = useSelector(
    (state: State) => RobotSelectors.getConnectRequest(state).inProgress
  )
  const dispatch = useDispatch<Dispatch>()
  const isUploadWithoutRPC = useFeatureFlag('preProtocolFlowWithoutRPC')

  const connect = isUploadWithoutRPC
    ? RobotActions.connect
    : RobotActions.legacyConnect

  const handleToggleConnect = (): void => {
    if (!connectInProgress) {
      const action = isConnected ? RobotActions.disconnect() : connect(name)

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
