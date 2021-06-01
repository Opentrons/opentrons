// setup labware page
import * as React from 'react'
import { connect } from 'react-redux'
import { Route, Redirect, withRouter } from 'react-router-dom'

import { selectors as robotSelectors } from '../../redux/robot'
import { getRobotSettings } from '../../redux/robot-settings'
import { getUnpreparedModules } from '../../redux/modules'

import { Page } from '../../atoms/Page'
import { SessionHeader } from '../../organisms/SessionHeader'
import { CalibrateLabware } from './CalibrateLabware'
import { ReviewDeck } from './ReviewDeck'
import { ConfirmModal } from './CalibrateLabware/ConfirmModal'
import { ConnectModules } from './ConnectModules'
import { PrepareModules } from './PrepareModules'

import type { RouteComponentProps } from 'react-router-dom'
import type { State } from '../../redux/types'
import type { Labware as RobotLabware } from '../../redux/robot/types'
import type { AttachedModule } from '../../redux/modules/types'

type OP = RouteComponentProps<{ slot: string }>

interface SP {
  deckPopulated: boolean
  labware?: RobotLabware | null
  calibrateToBottom: boolean
  robotName: string | null
  hasModulesLeftToReview: boolean | null | undefined
  unpreparedModules: AttachedModule[]
}

type Props = OP & SP

export const Labware = withRouter(connect(mapStateToProps)(LabwareComponent))

function LabwareComponent(props: Props): JSX.Element {
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

  const renderPage = (): JSX.Element => {
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
