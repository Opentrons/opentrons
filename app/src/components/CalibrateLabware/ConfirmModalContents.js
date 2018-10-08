// @flow
// contents container for ConfirmModal
import * as React from 'react'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  type Pipette,
  type Labware,
} from '../../robot'

import ConfirmPositionContents from './ConfirmPositionContents'
import ConfirmPickupContents from './ConfirmPickupContents'
import InProgressContents from './InProgressContents'

type OwnProps = Labware

type StateProps = {
  calibrator: ?Pipette,
}

type Props = OwnProps & StateProps

export default connect(mapStateToProps)(ConfirmModalContents)

function ConfirmModalContents (props: Props) {
  if (!props.calibrator) return null

  switch (props.calibration) {
    case 'unconfirmed':
    case 'over-slot':
    case 'jogging':
      return (<ConfirmPositionContents {...props} />)

    case 'picked-up':
      return (<ConfirmPickupContents {...props} />)

    case 'moving-to-slot':
    case 'picking-up':
    case 'dropping-tip':
    case 'confirming':
      return (<InProgressContents {...props} />)

    default:
      return null
  }
}

function mapStateToProps (state, ownProps: OwnProps): StateProps {
  const calibratorMount = ownProps.calibratorMount
  const pipettes = robotSelectors.getPipettes(state)
  const calibrator = (
    pipettes.find((i) => i.mount === calibratorMount) ||
    robotSelectors.getCalibrator(state)
  )

  return {calibrator}
}
