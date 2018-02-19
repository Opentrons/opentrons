// @flow
// connect and configure robots page
import React from 'react'
import {connect} from 'react-redux'
import {withRouter, Redirect, type ContextRouter} from 'react-router'

import type {State} from '../types'
import {selectors as robotSelectors, type Robot} from '../robot'

import {TitleBar} from '@opentrons/components'
import Page from '../components/Page'
import RobotStatus from '../components/RobotSettings'
import Splash from '../components/Splash'

type StateProps = {
  robot: ?Robot
}

type Props = StateProps & ContextRouter

export default withRouter(connect(mapStateToProps)(RobotSettingsPage))

function RobotSettingsPage (props: Props) {
  const {robot, match: {url, params: {name}}} = props

  if (name && !robot) {
    console.warn(`Robot ${name} does not exist; redirecting`)
    return (<Redirect to={url.replace(`/${name}`, '')} />)
  }

  return (
    <Page>
      {!robot && (<Splash />)}
      {robot && (<TitleBar title={robot.name} />)}
      {robot && (<RobotStatus {...robot} />)}
    </Page>
  )
}

function mapStateToProps (state: State, ownProps: ContextRouter): StateProps {
  const {match: {params: {name}}} = ownProps
  const robots = robotSelectors.getDiscovered(state)

  return {
    robot: robots.find((r) => r.name === name)
  }
}
