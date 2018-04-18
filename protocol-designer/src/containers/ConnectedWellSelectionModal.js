// @flow
import * as React from 'react'
import WellSelectionModal from '../components/WellSelectionModal'
import {connect} from 'react-redux'
import type {BaseState} from '../types'
import type {Dispatch} from 'redux'
import {selectors as navigationSelectors} from '../navigation'
import {closeWellSelectionModal} from '../steplist/actions'

export default connect(mapStateToProps, mapDispatchToProps)(WellSelectionModal)

type Props = React.ElementProps<typeof WellSelectionModal>

type OP = {} // TODO IMMED

type DP = {
  onSave: $PropertyType<Props, 'onSave'>,
  onCloseClick: $PropertyType<Props, 'onCloseClick'>
}

type SP = $Diff<Props, DP>

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  return {
    // show them modal when there is a selected container
    hideModal: !navigationSelectors.wellSelectionModal(state),
    pipette: {channels: 8, mount: 'left', id: 'fakse pipette', maxVolume: 42}
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    onSave: () => console.log('TODO save wells'), // TODO dispatch for save etc
    onCloseClick: () => dispatch(closeWellSelectionModal())
  }
}
