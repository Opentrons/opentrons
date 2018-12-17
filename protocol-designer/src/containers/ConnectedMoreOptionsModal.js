// @flow
// import * as React from 'react'
import {connect} from 'react-redux'

import MoreOptionsModal from '../components/modals/MoreOptionsModal'

import {actions as stepsActions, selectors} from '../ui/steps'
import {
  cancelMoreOptionsModal,
  changeMoreOptionsModalInput,
} from '../steplist/actions'

import type {BaseState, ThunkDispatch} from '../types'

function mapStateToProps (state: BaseState) {
  const formModalData = selectors.getFormModalData(state)
  return {
    hideModal: formModalData === null,
    formData: formModalData,
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>) {
  return {
    onCancel: () => dispatch(cancelMoreOptionsModal()),
    onSave: () => dispatch(stepsActions.saveMoreOptionsModal()),

    handleChange: (accessor: string) => (e: SyntheticInputEvent<*>) => {
      // NOTE this is similar to ConnectedStepEdit form, is it possible to make a more general reusable fn?
      dispatch(changeMoreOptionsModalInput({update: {[accessor]: e.target.value}}))
    },

    onClickAway: () => dispatch(cancelMoreOptionsModal()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MoreOptionsModal)
