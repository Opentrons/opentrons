// @flow
// setup instruments page
import React from 'react'
import {connect} from 'react-redux'
import {withRouter, type ContextRouter} from 'react-router'

import {selectors as robotSelectors} from '../robot'
import Page from '../components/Page'
import LabwareCalibration from '../components/LabwareCalibration'
import SessionHeader from '../containers/SessionHeader'
import ReviewDeckModal from '../components/ReviewDeckModal'

type StateProps = {
  deckPopulated: boolean
}

type Props = ContextRouter & StateProps

export default withRouter(connect(mapStateToProps)(SetupDeckPage))

function SetupDeckPage (props: Props) {
  const {deckPopulated, match: {url, params: {slot}}} = props

  return (
    <Page>
      <SessionHeader />
      <LabwareCalibration slot={slot} url={url} />
      {!deckPopulated && (
        <ReviewDeckModal slot={slot} />
      )}
    </Page>
  )
}

function mapStateToProps (state): StateProps {
  return {
    deckPopulated: robotSelectors.getDeckPopulated(state)
  }
}
