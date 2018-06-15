// @flow
// setup instruments page
import React from 'react'
import {connect} from 'react-redux'
import {Route, Redirect, withRouter, type ContextRouter, type Match} from 'react-router'
import {push} from 'react-router-redux'
import {
  selectors as robotSelectors,
  type Labware
} from '../../robot'

import Page, {PageWrapper} from '../../components/Page'
import LabwareCalibration from '../../components/LabwareCalibration'
import SessionHeader from '../../components/SessionHeader'
import ReviewDeckModal from '../../components/ReviewDeckModal'
import ConfirmModal from '../../components/LabwareCalibration/ConfirmModal'

type OwnProps = {
  match: Match
}

type StateProps = {
  deckPopulated: boolean,
  labware: ?Labware
}

type DispatchProps = {onBackClick: () => void}

type Props = ContextRouter & StateProps & OwnProps & DispatchProps

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SetupDeckPage))

function SetupDeckPage (props: Props) {
  const {labware, deckPopulated, onBackClick, match: {url, params: {slot}}} = props
  console.log(url)
  return (
    <PageWrapper>
    <Page
      titleBarProps={{title: (<SessionHeader />)}}
    >
      <LabwareCalibration labware={labware} />
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
        <ConfirmModal labware={labware} onBackClick={onBackClick} />
      )
    }} />
    </PageWrapper>
  )
}

function mapStateToProps (state, ownProps: OwnProps): StateProps {
  const {match: {url, params: {slot}}} = ownProps
  const labware = robotSelectors.getLabware(state)
  const currentLabware = labware.find((lw) => lw.slot === slot)

  return {
    deckPopulated: !!robotSelectors.getDeckPopulated(state),
    labware: currentLabware,
    slot,
    url
  }
}

function mapDispatchToProps (dispatch, ownProps: OwnProps): DispatchProps {
  const {match: {url}} = ownProps
  return {
    onBackClick: () => { dispatch(push(url)) }
  }
}
