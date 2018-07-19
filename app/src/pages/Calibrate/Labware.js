// @flow
// setup labware page
import * as React from 'react'
import {connect} from 'react-redux'
import {Route, Redirect, withRouter, type Match} from 'react-router'
import {push} from 'react-router-redux'
import type {State, Dispatch} from '../../types'
import type {Labware, Robot, StateModule} from '../../robot'
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

type SP = {
  deckPopulated: boolean,
  labware: ?Labware,
  calibrateToBottom: boolean,
  robot: Robot,
  modules: Array<StateModule>,
  actualModules: Array<?Module>,
  reviewModules: ?boolean
}

type DP = {
  dispatch: Dispatch
}

type Props = SP & OP & {
  onBackClick: () => void,
  fetchModules: () => mixed,
  setModulesReviewed: () => mixed,
}

export default withRouter(connect(makeMapStateToProps, null, mergeProps)(SetupDeckPage))

function SetupDeckPage (props: Props) {
  const {
    calibrateToBottom,
    labware,
    deckPopulated,
    modules,
    actualModules,
    reviewModules,
    onBackClick,
    fetchModules,
    setModulesReviewed,
    match: {url, params: {slot}}
  } = props

  const modulesMissing = compareNames(modules, actualModules)
  const onClick = modulesMissing
    ? fetchModules
    : setModulesReviewed
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
          onClick={onClick}
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

    const modulesReviewed = robotSelectors.getModulesReviewed(state)
    const modulesFlag = getModulesOn(state)
    const modulesRequired = modules[0]

    const reviewModules = modulesFlag && !modulesReviewed && modulesRequired
    return {
      deckPopulated: !!robotSelectors.getDeckPopulated(state),
      labware: currentLabware,
      slot,
      url,
      calibrateToBottom,
      robot,
      modules,
      actualModules: actualModules || [],
      reviewModules
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
    },
    setModulesReviewed: () => { dispatch(robotActions.setModulesReviewed(true)) }
  }
}

// TODO (ka 2018-7-19): type this more specifically
function getNames (array: Array<any> | []): Array<string> {
  const names = array
    ? array.map((m) => { return m.name }).sort()
    : []
  return names
}

function compareNames (a: Array<StateModule>, b: Array<?Module> | null) {
  const mods = getNames(a)
  const actMods = b
    ? getNames(b)
    : []
  if (mods.length !== actMods.length) {
    return true
  }
  return !mods.every(e => actMods.includes(e))
}
