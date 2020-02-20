// @flow
// pickup confirmation contents container for ConfirmModal
import { connect } from 'react-redux'

import { actions as robotActions } from '../../robot'
import { ConfirmPickupPrompt } from './ConfirmPickupPrompt'

import type { Dispatch } from '../../types'
import type { Labware, Pipette } from '../../robot'

type OP = {|
  labware: Labware,
  calibrator: Pipette,
|}

type DP = {|
  onNoClick: () => void,
  onYesClick: () => void,
|}

type Props = {| ...OP, ...DP |}

export const ConfirmPickupContents = connect<Props, OP, _, _, _, _>(
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
