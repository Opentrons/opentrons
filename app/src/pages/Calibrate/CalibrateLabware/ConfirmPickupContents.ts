// pickup confirmation contents container for ConfirmModal
import { connect } from 'react-redux'

import { actions as robotActions } from '../../../redux/robot'
import { ConfirmPickupPrompt } from './ConfirmPickupPrompt'

import type { MapDispatchToProps } from 'react-redux'
import type { Labware, Pipette } from '../../../redux/robot'

interface OP {
  labware: Labware
  calibrator: Pipette
}

interface DP {
  onNoClick: () => void
  onYesClick: () => void
}

const mapDispatchToProps: MapDispatchToProps<DP, OP> = (dispatch, ownProps) => {
  const {
    labware: { slot },
    calibrator: { mount },
  } = ownProps

  return {
    onNoClick: () => {
      dispatch(robotActions.dropTipAndHome(mount, slot))
    },
    onYesClick: () => {
      dispatch(robotActions.confirmTiprack(mount, slot))
    },
  }
}

export const ConfirmPickupContents = connect(
  null,
  mapDispatchToProps
)(ConfirmPickupPrompt)
