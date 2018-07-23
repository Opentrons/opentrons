// @flow
// setup labware page
import * as React from 'react'
import {connect} from 'react-redux'
import {Route, Redirect, withRouter, type Match} from 'react-router'
import {push} from 'react-router-redux'
import countBy from 'lodash/countBy'

import type {State, Dispatch} from '../../types'
import type {Labware, Robot, SessionModule} from '../../robot'
import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'
import {getModulesOn} from '../../config'
import type {Module} from '../../http-api-client'
import {makeGetRobotSettings, makeGetRobotModules, fetchModules} from '../../http-api-client'
import Page, {RefreshWrapper} from '../../components/Page'
import CalibrateLabware from '../../components/CalibrateLabware'
import SessionHeader from '../../components/SessionHeader'
import ReviewDeckModal from '../../components/ReviewDeckModal'
import ConfirmModal from '../../components/CalibrateLabware/ConfirmModal'
import ConnectModulesModal from '../../components/ConnectModulesModal'
type OP = {
  match: Match
}

// TODO(mc, 2018-07-19): rename mergeProps-only properties with _privateName
type SP = {
  deckPopulated: boolean,
  labware: ?Labware,
  calibrateToBottom: boolean,
  _robot: ?Robot,
  modulesMissing: boolean,
  reviewModules: ?boolean,
}

type DP = {dispatch: Dispatch}

type Props = SP & OP & {
  onBackClick: () => mixed,
  fetchModules: () => mixed,
  onReviewPromptClick: () => mixed,
}

export default withRouter(connect(makeMapStateToProps, null, mergeProps)(SetupDeckPage))

function SetupDeckPage (props: Props) {
  const {
    calibrateToBottom,
    labware,
    deckPopulated,
    modulesMissing,
    reviewModules,
    onBackClick,
    fetchModules,
    onReviewPromptClick,
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
      {reviewModules && (
        <ConnectModulesModal
          onClick={onReviewPromptClick}
          modulesMissing={modulesMissing}
        />
      )}
      {(!deckPopulated && !reviewModules) && (
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
    const _robot = robotSelectors.getConnectedRobot(state)

    // TODO(mc, 2018-07-19): API selector for getting the response directly
    const settingsResponse = _robot && getRobotSettings(state, _robot).response
    const settings = settingsResponse && settingsResponse.settings
    const flag = !!settings && settings.find((s) => s.id === 'calibrateToBottom')
    const calibrateToBottom = !!flag && flag.value

    const modules = robotSelectors.getModules(state)

    const modulesCall = _robot && getRobotModules(state, _robot)
    const modulesResponse = modulesCall && modulesCall.response
    const actualModules = modulesResponse && modulesResponse.modules

    const modulesReviewed = robotSelectors.getModulesReviewed(state)
    const modulesFlag = getModulesOn(state)
    const modulesRequired = modules[0]

    const reviewModules = modulesFlag && !modulesReviewed && !!modulesRequired

    return {
      slot,
      url,
      calibrateToBottom,
      reviewModules,
      _robot,
      modulesMissing: checkModules(modules, actualModules),
      deckPopulated: !!robotSelectors.getDeckPopulated(state),
      labware: currentLabware
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {match: {url}} = ownProps
  const {dispatch} = dispatchProps
  const {_robot, modulesMissing} = stateProps

  const fetchMods = () => _robot && dispatch(fetchModules(_robot))
  const onReviewPromptClick = modulesMissing
    ? fetchMods
    : () => dispatch(robotActions.setModulesReviewed(true))

  return {
    ...stateProps,
    ...ownProps,
    onReviewPromptClick,
    fetchModules: fetchMods,
    onBackClick: () => dispatch(push(url))
  }
}

function checkModules (
  required: Array<SessionModule>,
  actual: ?Array<Module>
): boolean {
  const requiredNames = countBy(required, 'name')
  const actualNames = countBy(actual, 'name')

  return Object.keys(requiredNames)
    .some(n => requiredNames[n] !== actualNames[n])
}
