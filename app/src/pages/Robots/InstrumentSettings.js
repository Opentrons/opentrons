// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter, Switch, Route, type Match} from 'react-router'

import type {State, Dispatch, Error} from '../../types'
import {type Robot} from '../../robot'

import {
  makeGetRobotHome,
  clearHomeResponse
} from '../../http-api-client'

import {SpinnerModalPage} from '@opentrons/components'
import {ErrorModal} from '../../components/modals'
import InstrumentSettings from '../../components/InstrumentSettings'
import ChangePipette from '../../components/ChangePipette'
import Page from '../../components/Page'

type SP ={
  homeInProgress: ?boolean,
  homeError: ?Error,
}

type OP = {
  robot: Robot,
  match: Match,
}

type DP = {dispatch: Dispatch}

type Props = SP & OP & {
  closeHomeAlert?: () => mixed
}

export default withRouter(
  connect(makeMapStateToProps, null, mergeProps)(InstrumentSettingsPage)
)

function InstrumentSettingsPage (props: Props) {
  const {
    robot,
    homeInProgress,
    homeError,
    closeHomeAlert,
    match: {path, url}
  } = props
  const titleBarProps = {title: robot.name}

  return (
    <React.Fragment>
    <Page titleBarProps={titleBarProps}>
      <InstrumentSettings {...robot} />
    </Page>
    <Switch>
      <Route path={`${path}/pipettes`} render={(props) => (
        <ChangePipette {...props} robot={robot} parentUrl={url} />
      )} />
      <Route exact path={path} render={() => {
        // only show homing spinner and error on main page
        // otherwise, it will show up during homes in pipette swap
        return (
          <React.Fragment>
            {homeInProgress && (
              <SpinnerModalPage
                titleBar={titleBarProps}
                message='Robot is homing.'
              />
            )}

            {!!homeError && (
              <ErrorModal
                heading='Robot unable to home'
                error={homeError}
                description='Robot was unable to home, please try again.'
                close={closeHomeAlert}
              />
            )}
          </React.Fragment>
        )
      }} />
    </Switch>
    </React.Fragment>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getHomeRequest = makeGetRobotHome()
  return (state, ownProps) => {
    const {robot} = ownProps
    const homeRequest = getHomeRequest(state, robot)

    return {
      homeInProgress: homeRequest && homeRequest.inProgress,
      homeError: homeRequest && homeRequest.error
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {robot} = ownProps
  const {dispatch} = dispatchProps
  return {
    ...stateProps,
    ...ownProps,
    closeHomeAlert: () => dispatch(clearHomeResponse(robot))
  }
}
