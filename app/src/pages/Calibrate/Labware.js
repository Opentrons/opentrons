// @flow
// setup instruments page
import * as React from 'react'
import {connect} from 'react-redux'
import {Route, Redirect, withRouter, type Match} from 'react-router'
import {push} from 'react-router-redux'
import type {State, Dispatch} from '../../types'
import type {Labware, Robot, StateModule} from '../../robot'
import {selectors as robotSelectors} from '../../robot'
import {getModulesOn} from '../../config'
import type {Module} from '../../http-api-client'
import {makeGetRobotSettings, makeGetRobotModules, fetchModules} from '../../http-api-client'
import Page, {RefreshWrapper} from '../../components/Page'
import CalibrateLabware from '../../components/CalibrateLabware'
import SessionHeader from '../../components/SessionHeader'
import ReviewDeckModal from '../../components/ReviewDeckModal'
import ConfirmModal from '../../components/CalibrateLabware/ConfirmModal'

type OP = {
  match: Match
}

type SP = {
  deckPopulated: boolean,
  labware: ?Labware,
  calibrateToBottom: boolean,
  robot: Robot,
  modulesFlag: ?boolean,
  modules: Array<StateModule>,
  actualModules: ?Array<Module>,
}

type DP = {
  dispatch: Dispatch
}

type Props = SP & OP & {
  onBackClick: () => void,
  fetchModules: () => mixed,
}

export default withRouter(connect(makeMapStateToProps, null, mergeProps)(SetupDeckPage))

function SetupDeckPage (props: Props) {
  const {
    calibrateToBottom,
    labware,
    deckPopulated,
    onBackClick,
    fetchModules,
    match: {url, params: {slot}}
  } = props

  return (
    <RefreshWrapper
      refresh={fetchModules}
    >
      <Page
        titleBarProps={{title: (<SessionHeader />)}}
      >
        <CalibrateLabware labware={labware} />
      </Page>
      {!deckPopulated && (
        <ReviewDeckModal slot={slot} />
      )}
      <Route path={`${url}/confirm`} render={() => {
        if (!labware || labware.calibration === 'confirmed') {
          return (
            <Redirect to={url} />
          )
        }

        return (
          <ConfirmModal labware={labware} onBackClick={onBackClick} calibrateToBottom={calibrateToBottom}/>
        )
      }} />
    </RefreshWrapper>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotSettings = makeGetRobotSettings()
  const getRobotModules = makeGetRobotModules()

  return (state, ownProps) => {
    const {match: {url, params: {slot}}} = ownProps
    const labware = robotSelectors.getLabware(state)
    const currentLabware = labware.find((lw) => lw.slot === slot)
    const name = robotSelectors.getConnectedRobotName(state)
    const robot = robotSelectors.getConnectedRobot(state)

    const settingsResponse = getRobotSettings(state, {name}).response
    const settings = settingsResponse && settingsResponse.settings
    const flag = !!settings && settings.find((s) => s.id === 'calibrateToBottom')
    const calibrateToBottom = !!flag && flag.value

    const modules = robotSelectors.getModules(state)
    const modulesCall = getRobotModules(state, robot)
    const modulesResponse = modulesCall.response
    const actualModules = modulesResponse && modulesResponse.modules

    return {
      deckPopulated: !!robotSelectors.getDeckPopulated(state),
      labware: currentLabware,
      slot,
      url,
      calibrateToBottom,
      robot,
      modulesFlag: getModulesOn(state),
      modules,
      actualModules
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {match: {url}} = ownProps
  const {dispatch} = dispatchProps
  const {robot} = stateProps
  return {
    ...stateProps,
    ...ownProps,
    onBackClick: () => { dispatch(push(url)) },
    fetchModules: () => {
      dispatch(fetchModules(robot))
    }
  }
}
