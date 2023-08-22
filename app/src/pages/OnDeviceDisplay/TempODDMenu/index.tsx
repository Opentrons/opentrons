import * as React from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { Flex, useMountEffect, PrimaryButton } from '@opentrons/components'

import { TertiaryButton } from '../../../atoms/buttons'
import { onDeviceDisplayRoutes } from '../../../App/OnDeviceDisplayApp'
import { State, Dispatch } from '../../../redux/types'
import { checkShellUpdate } from '../../../redux/shell'
import {
  getRobotUpdateVersion,
  startRobotUpdate,
} from '../../../redux/robot-update'
import { getLocalRobot } from '../../../redux/discovery'

import type { RouteProps } from '../../../App/types'

export function TempODDMenu(): JSX.Element {
  const dispatch = useDispatch<Dispatch>()

  useMountEffect(() => {
    dispatch(checkShellUpdate())
  })

  const localRobot = useSelector(getLocalRobot)
  const latestRobotSystemVersion = useSelector((state: State) =>
    localRobot ? getRobotUpdateVersion(state, localRobot.name) : null
  )

  return (
    <>
      <Flex marginBottom="2rem">Robot Dashboard</Flex>
      {latestRobotSystemVersion && (
        <PrimaryButton
          onClick={() =>
            dispatch(startRobotUpdate(localRobot?.displayName ?? ''))
          }
        >
          {`Download latest OT-3 system version ${latestRobotSystemVersion}`}
        </PrimaryButton>
      )}
      {/* TODO(bh, 2022-12-7): TEMP links to all routes to allow development throughout the app */}
      {onDeviceDisplayRoutes.map((route: RouteProps) => (
        <Flex key={route.path} margin="0.5rem">
          <Link to={route.path}>
            <TertiaryButton>{route.name}</TertiaryButton>
          </Link>
        </Flex>
      ))}
    </>
  )
}
