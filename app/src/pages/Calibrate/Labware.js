// @flow
// setup labware page
import * as React from 'react'
import {connect} from 'react-redux'
import {Route, Redirect, withRouter, type Match} from 'react-router'
import {push} from 'react-router-redux'

import type {State, Dispatch} from '../../types'
import type {Labware, Robot} from '../../robot'

import {selectors as robotSelectors} from '../../robot'
import {makeGetRobotSettings} from '../../http-api-client'
import {getModulesOn} from '../../config'

import Page from '../../components/Page'
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
  robot: ?Robot,
  reviewModules: ?boolean,
}

type DP = {onBackClick: () => mixed}

type Props = OP & SP & DP

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(SetupDeckPage)
)

function SetupDeckPage (props: Props) {
  const {
    robot,
    calibrateToBottom,
    labware,
    deckPopulated,
    reviewModules,
    onBackClick,
    match: {url, params: {slot}}
  } = props

  return (
    <React.Fragment>
      <Page titleBarProps={{title: (<SessionHeader />)}}>
        <CalibrateLabware labware={labware} />
      </Page>
      {robot && reviewModules && (
        <ConnectModulesModal robot={robot} />
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
    </React.Fragment>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotSettings = makeGetRobotSettings()

  return (state, ownProps) => {
    const {match: {url, params: {slot}}} = ownProps
    const labware = robotSelectors.getLabware(state)
    const currentLabware = labware.find((lw) => lw.slot === slot)
    const robot = robotSelectors.getConnectedRobot(state)

    // TODO(mc, 2018-07-19): API selector for getting the response directly
    const settingsResp = robot && getRobotSettings(state, robot).response
    const settings = settingsResp && settingsResp.settings

    // TODO(mc, 2018-07-23): make diagram component a container
    const calToBottomFlag = settings && settings.find(s => s.id === 'calibrateToBottom')
    const calibrateToBottom = !!calToBottomFlag && calToBottomFlag.value

    const modulesEnabled = getModulesOn(state)
    const modulesRequired = robotSelectors.getModules(state).length > 0
    const modulesReviewed = robotSelectors.getModulesReviewed(state)
    const reviewModules = modulesEnabled && modulesRequired && !modulesReviewed

    return {
      slot,
      url,
      calibrateToBottom,
      reviewModules,
      robot,
      deckPopulated: !!robotSelectors.getDeckPopulated(state),
      labware: currentLabware
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {match: {url}} = ownProps

  return {
    onBackClick: () => dispatch(push(url))
  }
}
