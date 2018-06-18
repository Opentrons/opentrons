// @flow
// info panel and controls for labware calibration page
import * as React from 'react'
import {connect} from 'react-redux'
import {Redirect, Route, withRouter} from 'react-router'
import {push} from 'react-router-redux'

import {
  selectors as robotSelectors,
  type Labware
} from '../../robot'

import DeckMap from '../DeckMap'
import InfoBox from './InfoBox'
import ConfirmModal from './ConfirmModal'

type OwnProps = {slot: ?string, url: string}
type StateProps = {labware: ?Labware}
type DispatchProps = {onBackClick: () => void}
type Props = StateProps & DispatchProps & OwnProps

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(LabwareCalibration)
)

function LabwareCalibration (props: Props) {
  const {url, labware, onBackClick} = props

  return (
    <div>
      <InfoBox {...props} />
      <DeckMap />
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
    </div>
  )
}

function mapStateToProps (state, ownProps: OwnProps): StateProps {
  // TODO(mc, 2018-02-05): getCurrentLabware selector
  const labware = robotSelectors.getLabware(state)
  const currentLabware = labware.find((lw) => lw.slot === ownProps.slot)

  return {labware: currentLabware}
}

function mapDispatchToProps (dispatch, ownProps: OwnProps): DispatchProps {
  return {
    onBackClick: () => { dispatch(push(ownProps.url)) }
  }
}
