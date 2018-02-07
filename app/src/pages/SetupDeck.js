// @flow
// setup instruments page
import React from 'react'
import {connect} from 'react-redux'
import {Redirect, Route, withRouter, type ContextRouter} from 'react-router'

import {selectors as robotSelectors} from '../robot'
import Page from '../components/Page'
import LabwareCalibrationInfo from '../components/LabwareCalibrationInfo'
import CalibrateDeck from '../components/deck/CalibrateDeck'
import SessionHeader from '../containers/SessionHeader'
import ConnectedJogModal from '../containers/ConnectedJogModal'
import ReviewDeckModal from '../components/ReviewDeckModal'

type StateProps = {
  deckPopulated: boolean
}

type Props = ContextRouter & StateProps

export default withRouter(connect(mapStateToProps)(SetupDeckPage))

function SetupDeckPage (props: Props) {
  const {location: {pathname}, match: {url, path, params: {slot}}} = props

  // redirect to review modal if deck not ready and we're not already there
  const redirectToReview = (
    !props.deckPopulated &&
    pathname.indexOf('/review') < 0
  )

  if (redirectToReview) return (<Redirect to={`${url}/review`} />)

  return (
    <Page>
      <SessionHeader subtitle='Setup Deck' />
      <LabwareCalibrationInfo slot={slot} />
      <CalibrateDeck slot={slot} />
      <Route path={`${path}/jog`} render={() => (
        <ConnectedJogModal slot={slot} />
      )} />
      <Route path={`${path}/review`} render={() => (
        <ReviewDeckModal slot={slot} closeUrl={url} />
      )} />
    </Page>
  )
}

function mapStateToProps (state): StateProps {
  return {
    deckPopulated: robotSelectors.getDeckPopulated(state)
  }
}
