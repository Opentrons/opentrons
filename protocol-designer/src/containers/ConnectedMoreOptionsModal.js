// @flow
// import * as React from 'react'
import {connect} from 'react-redux'

import MoreOptionsModal from '../components/modals/MoreOptionsModal'

import {actions as stepsActions, selectors} from '../ui/steps'

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
    onCancel: () => dispatch(stepsActions.cancelMoreOptionsModal()),
    onSave: () => dispatch(stepsActions.saveMoreOptionsModal()),

    handleChange: (accessor: string) => (e: SyntheticInputEvent<*>) => {
      // NOTE this is similar to ConnectedStepEdit form, is it possible to make a more general reusable fn?
      dispatch(stepsActions.changeMoreOptionsModalInput({update: {[accessor]: e.target.value}}))
    },

    onClickAway: () => dispatch(stepsActions.cancelMoreOptionsModal()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MoreOptionsModal)
