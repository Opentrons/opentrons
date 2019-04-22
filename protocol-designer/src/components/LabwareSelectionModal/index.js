// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import LabwareSelectionModal from './LabwareSelectionModal'
import {
  closeLabwareSelector,
  createContainer,
} from '../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import type { BaseState, ThunkDispatch } from '../../types'

type Props = React.ElementProps<typeof LabwareSelectionModal>

type SP = {|
  slot: $PropertyType<Props, 'slot'>,
  permittedTipracks: $PropertyType<Props, 'permittedTipracks'>,
|}

function mapStateToProps(state: BaseState): SP {
  return {
    slot: labwareIngredSelectors.selectedAddLabwareSlot(state) || null,
    permittedTipracks: stepFormSelectors.getPermittedTipracks(state),
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: ThunkDispatch<*> }
): Props {
  const dispatch = dispatchProps.dispatch

  return {
    ...stateProps,
    onClose: () => {
      dispatch(closeLabwareSelector())
    },
    selectLabware: containerType => {
      if (stateProps.slot) {
        dispatch(createContainer({ slot: stateProps.slot, containerType }))
      }
    },
  }
}

export default connect<Props, {||}, SP, {||}, _, _>(
  mapStateToProps,
  null,
  mergeProps
)(LabwareSelectionModal)
