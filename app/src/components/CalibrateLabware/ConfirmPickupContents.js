// @flow
// pickup confirmation contents container for ConfirmModal
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {
  actions as robotActions,
  type Labware,
  type Pipette,
} from '../../robot'

import ConfirmPickupPrompt from './ConfirmPickupPrompt'

type OwnProps = Labware & {
  calibrator: Pipette,
}

type DispatchProps = {
  onNoClick: () => void,
  onYesClick: () => void,
}

export default connect(null, mapDispatchToProps)(ConfirmPickupPrompt)

function mapDispatchToProps (
  dispatch: Dispatch<*>,
  ownProps: OwnProps
): DispatchProps {
  const {slot, calibrator: {mount}} = ownProps

  return {
    onNoClick: () => {
      dispatch(robotActions.dropTipAndHome(mount, slot))
    },
    onYesClick: () => {
      dispatch(robotActions.confirmTiprack(mount, slot))
    },
  }
}
