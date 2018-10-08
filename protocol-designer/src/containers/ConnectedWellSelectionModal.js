// @flow
import * as React from 'react'
import WellSelectionModal from '../components/WellSelectionModal'
import {connect} from 'react-redux'
import type {BaseState, ThunkDispatch} from '../types'
import wellSelectionSelectors from '../well-selection/selectors'
import {selectors as pipetteSelectors} from '../pipettes'
import {
  closeWellSelectionModal,
  saveWellSelectionModal,
} from '../well-selection/actions'

type Props = {
  ...React.ElementProps<typeof WellSelectionModal>,
  hideModal?: boolean,
}

function WellSelectionModalWrapper (props: Props) {
  if (props.hideModal) {
    return null
  }
  return <WellSelectionModal {...props} />
}

type DP = {
  onSave: $PropertyType<Props, 'onSave'>,
  onCloseClick: $PropertyType<Props, 'onCloseClick'>,
}

type SP = $Diff<Props, DP>

function mapStateToProps (state: BaseState): SP {
  const wellSelectionModalData = wellSelectionSelectors.wellSelectionModalData(state)

  if (!wellSelectionModalData) {
    return {
      hideModal: true,
    }
  }

  const pipetteId = wellSelectionModalData.pipetteId

  return {
    pipette: pipetteSelectors.equippedPipettes(state)[pipetteId],
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>): DP {
  return {
    onSave: () => dispatch(saveWellSelectionModal()),
    onCloseClick: () => dispatch(closeWellSelectionModal()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WellSelectionModalWrapper)
