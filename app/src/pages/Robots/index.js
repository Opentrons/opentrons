// @flow
// connect and configure robots page
import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter, Route, Switch, Redirect, type Match} from 'react-router'

import createLogger from '../../logger'
import {selectors as robotSelectors} from '../../robot'
import {getConnectableRobots, getReachableRobots} from '../../discovery'

import {Splash} from '@opentrons/components'
import Page from '../../components/Page'
import RobotSettings from './RobotSettings'
import InstrumentSettings from './InstrumentSettings'

import type {State} from '../../types'
// import type {Robot} from '../../robot'
import type {ViewableRobot} from '../../discovery'

type SP = {
  robot: ?ViewableRobot,
  connectedName: ?string,
}

type OP = {match: Match}

type Props = SP & OP

const log = createLogger(__filename)

export default withRouter(
  connect(mapStateToProps, null)(Robots)
)

function Robots (props: Props) {
  const {
    robot,
    connectedName,
    match: {path, url, params: {name}},
  } = props

  if (name && !robot) {
    const redirectUrl = url.replace(`/${name}`, '')
    log.warn(`Robot ${name} does not exist; redirecting`, {redirectUrl})
    return (<Redirect to={redirectUrl} />)
  } else if (!name && connectedName) {
    const redirectUrl = `${url}/${connectedName}`
    log.debug(`Connected to ${connectedName}; redirecting`, {redirectUrl})
    return (<Redirect to={redirectUrl} />)
  }

  if (!robot) return (<Page><Splash /></Page>)

  return (
    <Switch>
      {robot.status === 'connectable' && (
        <Route
          path={`${path}/instruments`}
          render={props => (<InstrumentSettings {...props} robot={robot} />)}
        />
      )}
      <Route
        path={path}
        render={() => (<RobotSettings robot={robot} />)}
      />
    </Switch>
  )
}

function mapStateToProps (state: State, ownProps: OP): SP {
  const {match: {params: {name}}} = ownProps
  const robots: Array<ViewableRobot> = getConnectableRobots(state)
    .concat(getReachableRobots(state))
  const connectedName = robotSelectors.getConnectedRobotName(state)
  const robot: ?ViewableRobot = robots.find(r => r.name === name)

  return {
    robot,
    connectedName,
  }
}
