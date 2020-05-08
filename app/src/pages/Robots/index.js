// @flow
// connect and configure robots page
import * as React from 'react'
import { useSelector } from 'react-redux'
import { useRouteMatch, Redirect } from 'react-router-dom'

import { createLogger } from '../../logger'

import {
  CONNECTABLE,
  getConnectedRobot,
  getViewableRobots,
} from '../../discovery'

import { getBuildrootRobot } from '../../buildroot'
import { getShellUpdateState } from '../../shell'

import { Splash } from '@opentrons/components'
import { Page } from '../../components/Page'
import { RobotSettings } from './RobotSettings'
import { InstrumentSettings } from './InstrumentSettings'

const log = createLogger(__filename)

export function Robots() {
  const { path, url, params } = useRouteMatch()
  const instrumentsMatch = useRouteMatch(`${path}/instruments`)
  const { name } = params

  const appUpdate = useSelector(getShellUpdateState)
  const viewableRobots = useSelector(getViewableRobots)
  const connectedRobot = useSelector(getConnectedRobot)
  const buildrootRobot = useSelector(getBuildrootRobot)
  const robot = viewableRobots.find(r => r.name === name) || null

  if (appUpdate.available && !appUpdate.seen) {
    log.warn('App update available on load, redirecting to app update.')
    return <Redirect to={'/menu/app/update'} />
  }

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
    />
  ) : (
    <RobotSettings robot={robot} appUpdate={appUpdate} />
  )
}
