// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import LabwareSelectionModal from './LabwareSelectionModal'
import {closeLabwareSelector, createContainer} from '../../labware-ingred/actions'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import {selectors as pipetteSelectors} from '../../pipettes'
import type {BaseState} from '../../types'

type Props = React.ElementProps<typeof LabwareSelectionModal>

type SP = {
  slot: $PropertyType<Props, 'slot'>,
  permittedTipracks: $PropertyType<Props, 'permittedTipracks'>
}

function mapStateToProps (state: BaseState): SP {
  return {
    slot: labwareIngredSelectors.canAdd(state) || null,
    permittedTipracks: pipetteSelectors.permittedTipracks(state)
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const dispatch = dispatchProps.dispatch

  return {
    ...stateProps,
    onClose: () => {
      dispatch(closeLabwareSelector())
    },
    selectLabware: (containerType) => {
      if (stateProps.slot) {
        dispatch(createContainer({slot: stateProps.slot, containerType}))
      }
    }
  }
}

export default connect(mapStateToProps, null, mergeProps)(LabwareSelectionModal)
