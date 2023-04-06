import * as React from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { Flex, useMountEffect, PrimaryButton } from '@opentrons/components'

import { TertiaryButton } from '../../../atoms/buttons'
import { onDeviceDisplayRoutes } from '../../../App/OnDeviceDisplayApp'
import { Dispatch } from '../../../redux/types'
import { checkShellUpdate } from '../../../redux/shell'
import {
  getBuildrootUpdateVersion,
  startBuildrootUpdate,
} from '../../../redux/buildroot'
import { getLocalRobot } from '../../../redux/discovery'
import { updateConfigValue } from '../../../redux/config'

import type { RouteProps } from '../../../App/types'

export function TempODDMenu(): JSX.Element {
  const dispatch = useDispatch<Dispatch>()

  useMountEffect(() => {
    dispatch(checkShellUpdate())
  })

  const localRobot = useSelector(getLocalRobot)
  const latestRobotSystemVersion = useSelector(getBuildrootUpdateVersion)

  return (
    <>
      <Flex marginBottom="2rem">Robot Dashboard</Flex>
      {latestRobotSystemVersion && (
        <PrimaryButton
          onClick={() =>
            dispatch(startBuildrootUpdate(localRobot?.displayName ?? ''))
          }
        >
          {`Download latest OT-3 system version ${latestRobotSystemVersion}`}
        </PrimaryButton>
      )}
      <Flex marginY="1rem">
        <PrimaryButton
          onClick={() =>
            dispatch(updateConfigValue('onDeviceDisplaySettings.brightness', 7))
          }
        >
          {'Change Display Brightness '}
        </PrimaryButton>
      </Flex>
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
