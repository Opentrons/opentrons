// @flow
// import * as React from 'react'
import {connect} from 'react-redux'

import ConfirmDeleteModal from '../components/modals/ConfirmModal'

import {selectors} from '../steplist/reducers'
import {
  cancelDeleteStepModal,
  deleteStep
} from '../steplist/actions'

import type {BaseState, ThunkDispatch} from '../types'

function mapStateToProps (state: BaseState) {
  const steps = selectors.getSteps(state)
  const stepId = selectors.selectedStepId(state)
  const step = (stepId === '__end__' || stepId === null)
      ? null
      : steps[stepId]

  if (step === null) {
    return {
      hideModal: true
    }
  }

  return {
    hideModal: !step.confirmDelete
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>) {
  return {
    headerText: 'Delete Step?',
    onCancel: () => dispatch(cancelDeleteStepModal()),
    onCancelText: 'CANCEL',
    onAction: () => dispatch(deleteStep()),
    onActionText: 'DELETE',

    onClickAway: () => dispatch(cancelDeleteStepModal())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmDeleteModal)
