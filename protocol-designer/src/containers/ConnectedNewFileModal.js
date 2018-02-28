// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import type {BaseState} from '../types'
import {selectors, actions as navigationActions} from '../navigation'
import {actions as fileActions} from '../file-data'

import NewFileModal from '../components/modals/NewFileModal'

export default connect(mapStateToProps, mapDispatchToProps)(NewFileModal)

type Props = React.ElementProps<typeof NewFileModal>

type StateProps = {
  hideModal: $PropertyType<Props, 'hideModal'>
}
type DispatchProps = $Diff<Props, StateProps>

function mapStateToProps (state: BaseState): StateProps {
  return {
    hideModal: !selectors.newProtocolModal(state)
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DispatchProps {
  return {
    onCancel: () => dispatch(navigationActions.toggleNewProtocolModal(false)),
    onSave: fields => dispatch(fileActions.updateFileFields(fields))
  }
}
