// @flow
import * as React from 'react'
import WellSelectionModal from '../components/WellSelectionModal'
import {connect} from 'react-redux'
import type {BaseState} from '../types'
import type {Dispatch} from 'redux'
import wellSelectionSelectors from '../well-selection/selectors'
import {selectors as fileDataSelectors} from '../file-data'
import {
  closeWellSelectionModal,
  saveWellSelectionModal
} from '../well-selection/actions'

type Props = React.ElementProps<typeof WellSelectionModal>
type HideModal = {hideModal: true}

export default connect(mapStateToProps, mapDispatchToProps)(WellSelectionModalWrapper)

function WellSelectionModalWrapper (props: Props) {
  if (props.hideModal) {
    return null
  }
  return <WellSelectionModal {...props} />
}

type DP = {
  onSave: $PropertyType<Props, 'onSave'>,
  onCloseClick: $PropertyType<Props, 'onCloseClick'>
}

type SP = $Diff<Props, DP>

function mapStateToProps (state: BaseState): SP | HideModal {
  const wellSelectionModalData = wellSelectionSelectors.wellSelectionModalData(state)

  if (wellSelectionModalData === null) {
    return {
      hideModal: true
    }
  }

  const pipetteId = wellSelectionModalData.pipetteId

  return {
    pipette: fileDataSelectors.equippedPipettes(state)[pipetteId]
  }
}

function mapDispatchToProps (dispatch: Dispatch<any>): DP { // TODO Ian 2018-04-18 properly type dispatch
  return {
    onSave: () => dispatch(saveWellSelectionModal()),
    onCloseClick: () => dispatch(closeWellSelectionModal())
  }
}
