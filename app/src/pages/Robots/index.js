// @flow
// connect and configure robots page
import * as React from 'react'
import { useSelector } from 'react-redux'
import { withRouter, Route, Switch, Redirect } from 'react-router-dom'

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

import type { ContextRouter } from 'react-router-dom'

type Props = {| ...ContextRouter |}

const log = createLogger(__filename)

export function RobotsComponent(props: Props) {
  const { path, url, params } = props.match
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

  return (
    <Switch>
      {robot.status === CONNECTABLE && (
        <Route
          path={`${path}/instruments`}
          render={routeProps => (
            <InstrumentSettings
              robotName={robot.name}
              robotDisplayName={robot.displayName}
              url={routeProps.match.url}
              path={routeProps.match.path}
            />
          )}
        />
      )}
      <Route
        path={path}
        render={() => <RobotSettings robot={robot} appUpdate={appUpdate} />}
      />
    </Switch>
  )
}

export const Robots = withRouter<_, _>(RobotsComponent)
