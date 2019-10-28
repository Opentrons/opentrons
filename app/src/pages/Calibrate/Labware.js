// @flow
// setup labware page
import * as React from 'react'
import { connect } from 'react-redux'
import { Route, Redirect, withRouter } from 'react-router-dom'
import { push } from 'connected-react-router'

import { selectors as robotSelectors } from '../../robot'
import { getConnectedRobot } from '../../discovery'
import { getRobotSettings } from '../../robot-settings'
import { getUnpreparedModules } from '../../robot-api/resources/modules'

import Page from '../../components/Page'
import CalibrateLabware from '../../components/CalibrateLabware'
import SessionHeader from '../../components/SessionHeader'
import ReviewDeck from '../../components/ReviewDeck'
import ConfirmModal from '../../components/CalibrateLabware/ConfirmModal'
import ConnectModules from '../../components/ConnectModules'
import PrepareModules from '../../components/PrepareModules'

import type { ContextRouter } from 'react-router-dom'
import type { State, Dispatch } from '../../types'
import type { Labware } from '../../robot'
import type { Robot } from '../../discovery'
import type { Module } from '../../robot-api'

type OP = ContextRouter

type SP = {|
  deckPopulated: boolean,
  labware: ?Labware,
  calibrateToBottom: boolean,
  robot: ?Robot,
  hasModulesLeftToReview: ?boolean,
  unpreparedModules: Array<Module>,
|}

type DP = {| onBackClick: () => mixed |}

type Props = {| ...OP, ...SP, ...DP |}

export default withRouter<_, _>(
  connect<Props, OP, SP, _, _, _>(
    mapStateToProps,
    mapDispatchToProps
  )(SetupDeckPage)
)

function SetupDeckPage(props: Props) {
  const {
    robot,
    calibrateToBottom,
    labware,
    unpreparedModules,
    deckPopulated,
    hasModulesLeftToReview,
    onBackClick,
    match: {
      url,
      params: { slot },
    },
  } = props

  if (!robot) {
    return <Redirect to="/" />
  }

  const renderPage = () => {
    if (hasModulesLeftToReview) {
      return <ConnectModules robot={robot} />
    } else if (unpreparedModules.length > 0) {
      return <PrepareModules robot={robot} modules={unpreparedModules} />
    } else if (!deckPopulated && !hasModulesLeftToReview) {
      return <ReviewDeck slot={slot} />
    } else {
      return <CalibrateLabware labware={labware} />
    }
  }
  return (
    <React.Fragment>
      <Page titleBarProps={{ title: <SessionHeader /> }}>{renderPage()}</Page>
      <Route
        path={`${url}/confirm`}
        render={() => {
          if (!labware || labware.calibration === 'confirmed') {
            return <Redirect to={url} />
          }

          return (
            <ConfirmModal
              labware={labware}
              onBackClick={onBackClick}
              calibrateToBottom={calibrateToBottom}
            />
          )
        }}
      />
    </React.Fragment>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { slot } = ownProps.match.params
  const labware = robotSelectors.getLabware(state)
  const currentLabware = labware.find(lw => lw.slot === slot)
  const modules = robotSelectors.getModules(state)
  const hasModulesLeftToReview =
    modules.length > 0 && !robotSelectors.getModulesReviewed(state)
  const robot = getConnectedRobot(state)
  const settings = robot && getRobotSettings(state, robot.name)

  // TODO(mc, 2018-07-23): make diagram component a container
  const calToBottomFlag =
    settings && settings.find(s => s.id === 'calibrateToBottom')
  const calibrateToBottom = !!calToBottomFlag && calToBottomFlag.value === true

  return {
    calibrateToBottom,
    robot,
    labware: currentLabware,
    deckPopulated: !!robotSelectors.getDeckPopulated(state),
    hasModulesLeftToReview,
    unpreparedModules: getUnpreparedModules(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const {
    match: { url },
  } = ownProps

  return {
    onBackClick: () => dispatch(push(url)),
  }
}
