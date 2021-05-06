// pickup confirmation contents container for ConfirmModal
import * as React from 'react'
import { connect } from 'react-redux'

import { actions as robotActions } from '../../../redux/robot'
import { ConfirmPickupPrompt } from './ConfirmPickupPrompt'

import type { Dispatch } from '../../../redux/types'
import type { Labware, Pipette } from '../../../redux/robot'

interface OP {
  labware: Labware,
  calibrator: Pipette,
}

interface DP {
  onNoClick: () => void,
  onYesClick: () => void,
}

type Props = OP & DP
export const ConfirmPickupContents: React.ComponentType<OP> = connect<Props, OP>(
  null,
  mapDispatchToProps
)(ConfirmPickupPrompt)

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
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
