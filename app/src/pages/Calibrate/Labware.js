// @flow
// setup labware page
import * as React from 'react'
import { connect } from 'react-redux'
import type { ContextRouter } from 'react-router-dom'
import { Redirect, Route, withRouter } from 'react-router-dom'

import { CalibrateLabware } from '../../components/CalibrateLabware'
import { ConfirmModal } from '../../components/CalibrateLabware/ConfirmModal'
import { ConnectModules } from '../../components/ConnectModules'
import { Page } from '../../components/Page'
import { PrepareModules } from '../../components/PrepareModules'
import { ReviewDeck } from '../../components/ReviewDeck'
import { SessionHeader } from '../../components/SessionHeader'
import { getUnpreparedModules } from '../../modules'
import type { AttachedModule } from '../../modules/types'
import { selectors as robotSelectors } from '../../robot'
import { getRobotSettings } from '../../robot-settings'
import type { Labware as RobotLabware } from '../../robot/types'
import type { Dispatch, State } from '../../types'

type OP = ContextRouter

type SP = {|
  deckPopulated: boolean,
  labware: ?RobotLabware,
  calibrateToBottom: boolean,
  robotName: string | null,
  hasModulesLeftToReview: ?boolean,
  unpreparedModules: Array<AttachedModule>,
|}

type Props = {| ...OP, ...SP, dispatch: Dispatch |}

export const Labware: React.AbstractComponent<
  $Diff<OP, ContextRouter>
> = withRouter(
  connect<Props, OP, SP, _, _, _>(mapStateToProps)(LabwareComponent)
)

function LabwareComponent(props: Props) {
  const {
    robotName,
    calibrateToBottom,
    labware,
    unpreparedModules,
    deckPopulated,
    hasModulesLeftToReview,
    match: {
      url,
      params: { slot },
    },
  } = props

  if (robotName === null) {
    return <Redirect to="/" />
  }

  const renderPage = () => {
    if (hasModulesLeftToReview) {
      return <ConnectModules robotName={robotName} />
    } else if (unpreparedModules.length > 0) {
      return (
        <PrepareModules robotName={robotName} modules={unpreparedModules} />
      )
    } else if (!deckPopulated && !hasModulesLeftToReview) {
      return <ReviewDeck slot={slot} />
    } else {
      return <CalibrateLabware labware={labware} />
    }
  }
  return (
    <>
      <Page titleBarProps={{ title: <SessionHeader /> }}>{renderPage()}</Page>
      <Route
        path={`${url}/confirm`}
        render={routeProps => {
          if (!labware || labware.calibration === 'confirmed') {
            return <Redirect to={url} />
          }

          return (
            <ConfirmModal
              labware={labware}
              onBackClick={() => routeProps.history.push(url)}
              calibrateToBottom={calibrateToBottom}
            />
          )
        }}
      />
    </>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { slot } = ownProps.match.params
  const labware = robotSelectors.getLabware(state)
  const currentLabware = labware.find(lw => lw.slot === slot)
  const modules = robotSelectors.getModules(state)
  const hasModulesLeftToReview =
    modules.length > 0 && !robotSelectors.getModulesReviewed(state)
  const robotName = robotSelectors.getConnectedRobotName(state)
  const settings = getRobotSettings(state, robotName)

  // TODO(mc, 2018-07-23): make diagram component a container
  const calToBottomFlag =
    settings && settings.find(s => s.id === 'calibrateToBottom')
  const calibrateToBottom = !!calToBottomFlag && calToBottomFlag.value === true

  return {
    calibrateToBottom,
    robotName,
    labware: currentLabware,
    deckPopulated: !!robotSelectors.getDeckPopulated(state),
    hasModulesLeftToReview,
    unpreparedModules: getUnpreparedModules(state),
  }
}
