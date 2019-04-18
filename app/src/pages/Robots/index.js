// @flow
// connect and configure robots page
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, Route, Switch, Redirect } from 'react-router'
import find from 'lodash/find'

import createLogger from '../../logger'

import {
  CONNECTABLE,
  getConnectedRobot,
  getConnectableRobots,
  getReachableRobots,
} from '../../discovery'

import { getShellUpdateState } from '../../shell'

import { Splash } from '@opentrons/components'
import Page from '../../components/Page'
import RobotSettings from './RobotSettings'
import InstrumentSettings from './InstrumentSettings'

import type { ContextRouter } from 'react-router'
import type { State } from '../../types'
import type { ViewableRobot } from '../../discovery'
import type { ShellUpdateState } from '../../shell'

type OP = ContextRouter

type SP = {|
  robot: ?ViewableRobot,
  connectedName: ?string,
  appUpdate: ShellUpdateState,
|}

type Props = { ...OP, ...SP }

const log = createLogger(__filename)

export default withRouter<{||}>(
  connect<Props, ContextRouter, SP, _, _, _>(mapStateToProps)(Robots)
)

function Robots(props: Props) {
  const {
    robot,
    connectedName,
    appUpdate,
    match: {
      path,
      url,
      params: { name },
    },
  } = props

  if (appUpdate.available && !appUpdate.seen) {
    log.warn('App update available on load, redirecting to app update.')
    return <Redirect to={'menu/app/update'} />
  }

  if (name && !robot) {
    const redirectUrl = url.replace(`/${name}`, '')
    log.warn(`Robot ${name} does not exist; redirecting`, { redirectUrl })
    return <Redirect to={redirectUrl} />
  } else if (!name && connectedName) {
    const redirectUrl = `${url}/${connectedName}`
    log.debug(`Connected to ${connectedName}; redirecting`, { redirectUrl })
    return <Redirect to={redirectUrl} />
  }

  if (!robot) {
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
          render={props => <InstrumentSettings {...props} robot={robot} />}
        />
      )}
      <Route
        path={path}
        render={() => <RobotSettings robot={robot} appUpdate={appUpdate} />}
      />
    </Switch>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { name } = ownProps.match.params
  const robots: Array<ViewableRobot> = getConnectableRobots(state).concat(
    getReachableRobots(state)
  )
  const connectedRobot = getConnectedRobot(state)
  const connectedName = connectedRobot && connectedRobot.name
  const robot: ?ViewableRobot = find(robots, { name })

  return {
    robot,
    connectedName,
    appUpdate: getShellUpdateState(state),
  }
}
