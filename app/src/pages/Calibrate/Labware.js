// @flow
// setup instruments page
import * as React from 'react'
import {connect} from 'react-redux'
import {Route, Redirect, withRouter, type ContextRouter, type Match} from 'react-router'
import {push} from 'react-router-redux'
import type {State} from '../../types'
import {
  selectors as robotSelectors,
  type Labware
} from '../../robot'
import {makeGetRobotSettings} from '../../http-api-client'
import Page from '../../components/Page'
import CalibrateLabware from '../../components/CalibrateLabware'
import SessionHeader from '../../components/SessionHeader'
import ReviewDeckModal from '../../components/ReviewDeckModal'
import ConfirmModal from '../../components/CalibrateLabware/ConfirmModal'

type OwnProps = {
  match: Match
}

type StateProps = {
  deckPopulated: boolean,
  labware: ?Labware,
  calibrateToBottom: boolean
}

type DispatchProps = {onBackClick: () => void}

type Props = ContextRouter & StateProps & OwnProps & DispatchProps

export default withRouter(connect(makeMapStateToProps, mapDispatchToProps)(SetupDeckPage))

function SetupDeckPage (props: Props) {
  const {calibrateToBottom, labware, deckPopulated, onBackClick, match: {url, params: {slot}}} = props

  return (
    <React.Fragment>
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
    </React.Fragment>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OwnProps) => StateProps {
  const getRobotSettings = makeGetRobotSettings()

  return (state, ownProps) => {
    const {match: {url, params: {slot}}} = ownProps
    const labware = robotSelectors.getLabware(state)
    const currentLabware = labware.find((lw) => lw.slot === slot)
    const name = robotSelectors.getConnectedRobotName(state)
    const response = getRobotSettings(state, {name}).response
    const settings = response && response.settings
    return {
      deckPopulated: !!robotSelectors.getDeckPopulated(state),
      labware: currentLabware,
      slot,
      url,
      calibrateToBottom: !!settings && settings[2].value
    }
  }
}

function mapDispatchToProps (dispatch, ownProps: OwnProps): DispatchProps {
  const {match: {url}} = ownProps
  return {
    onBackClick: () => { dispatch(push(url)) }
  }
}
