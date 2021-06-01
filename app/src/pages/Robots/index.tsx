// connect and configure robots page
import * as React from 'react'
import { useSelector } from 'react-redux'
import { useRouteMatch, Redirect, useLocation } from 'react-router-dom'

import {
  CONNECTABLE,
  getConnectedRobot,
  getViewableRobots,
} from '../../redux/discovery'

import { getBuildrootRobot } from '../../redux/buildroot'

import { Splash } from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { RobotSettings } from './RobotSettings'
import { InstrumentSettings } from './InstrumentSettings'
import { ModuleSettings } from './ModuleSettings'

export function Robots(): JSX.Element {
  const { path, url, params } = useRouteMatch<{ name: string }>()
  const instrumentsMatch = useRouteMatch(`${path}/instruments`)
  const modulesMatch = useRouteMatch(`${path}/modules`)
  const location = useLocation()
  const { name } = params

  const viewableRobots = useSelector(getViewableRobots)
  const connectedRobot = useSelector(getConnectedRobot)
  const buildrootRobot = useSelector(getBuildrootRobot)
  const robot = viewableRobots.find(r => r.name === name) || null

  if (!robot) {
    const baseUrl = name != null ? url.replace(`/${name}`, '') : url

    if (buildrootRobot) {
      return <Redirect to={`${baseUrl}/${buildrootRobot.name}`} />
    }

    if (connectedRobot) {
      return <Redirect to={`${baseUrl}/${connectedRobot.name}`} />
    }

    return (
      <Page>
        <Splash />
      </Page>
    )
  }

  return robot.status === CONNECTABLE && instrumentsMatch ? (
    <InstrumentSettings
      robotName={robot.name}
      robotDisplayName={robot.displayName}
      url={instrumentsMatch.url}
      path={instrumentsMatch.path}
      pathname={location && location.pathname}
    />
  ) : robot.status === CONNECTABLE && modulesMatch ? (
    <ModuleSettings
      robotName={robot.name}
      robotDisplayName={robot.displayName}
    />
  ) : (
    <RobotSettings robot={robot} />
  )
}
