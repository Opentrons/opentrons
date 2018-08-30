// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import type {BaseState} from '../types'
import {selectors, actions as navigationActions} from '../navigation'
import {actions as fileActions, selectors as loadFileSelectors} from '../load-file'
import type {NewProtocolFields} from '../load-file'

import NewFileModal from '../components/modals/NewFileModal'

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(NewFileModal)

type Props = React.ElementProps<typeof NewFileModal>

type SP = {
  hideModal: $PropertyType<Props, 'hideModal'>,
  _hasUnsavedChanges: ?boolean
}
type DP = {
  onCancel: () => mixed,
  _createNewProtocol: (NewProtocolFields) => mixed
}

function mapStateToProps (state: BaseState): SP {
  return {
    hideModal: !selectors.newProtocolModal(state),
    _hasUnsavedChanges: loadFileSelectors.hasUnsavedChanges(state)
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    onCancel: () => dispatch(navigationActions.toggleNewProtocolModal(false)),
    _createNewProtocol: fields => { dispatch(fileActions.createNewProtocol(fields)) }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP): Props {
  return {
    hideModal: stateProps.hideModal,
    onCancel: dispatchProps.onCancel,
    onSave: (fields) => {
      if (!stateProps._hasUnsavedChanges || confirm('TEST')) {
        dispatchProps._createNewProtocol(fields)
      }
    }
  }
}
