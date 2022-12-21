import * as React from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import semver from 'semver'

import { Flex, useMountEffect } from '@opentrons/components'

import { PrimaryButton, TertiaryButton } from '../../../atoms/buttons'
import { onDeviceDisplayRoutes } from '../../../App/OnDeviceDisplayApp'
import { Dispatch } from '../../../redux/types'
import { checkShellUpdate, CURRENT_VERSION } from '../../../redux/shell'
import {
  getBuildrootUpdateVersion,
  startBuildrootUpdate,
} from '../../../redux/buildroot'
import { getLocalRobot } from '../../../redux/discovery'

import type { RouteProps } from '../../../App/types'

export function RobotDashboard(): JSX.Element {
  const dispatch = useDispatch<Dispatch>()

  useMountEffect(() => {
    dispatch(checkShellUpdate())
  })

  const localRobot = useSelector(getLocalRobot)

  const currentVersion = CURRENT_VERSION
  const latestRobotSystemVersion = useSelector(getBuildrootUpdateVersion)

  console.log(currentVersion, latestRobotSystemVersion)


  if (
    latestRobotSystemVersion != null &&
    semver.gt(latestRobotSystemVersion, currentVersion)
  ) {
    console.log('robot system update available!')
  }

  return (
    <>
      <Flex marginBottom="2rem">Robot Dashboard</Flex>
      {localRobot?.displayName &&
        latestRobotSystemVersion != null &&
        semver.gt(latestRobotSystemVersion, currentVersion) && (
          <PrimaryButton
            onClick={() =>
              dispatch(startBuildrootUpdate(localRobot?.displayName))
            }
          >
            {' '}
            Download Update{' '}
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
