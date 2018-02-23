// @flow
// import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'

import MoreOptionsModal from '../components/modals/MoreOptionsModal'

import {selectors} from '../steplist/reducers'
import {
  deleteStep,
  cancelMoreOptionsModal,
  changeMoreOptionsModalInput,
  saveMoreOptionsModal
} from '../steplist/actions'

import type {BaseState} from '../types'

function mapStateToProps (state: BaseState) {
  const formModalData = selectors.formModalData(state)
  return {
    hideModal: formModalData === null,
    formData: formModalData
  }
}

function mapDispatchToProps (dispatch: Dispatch<any>) {
  return {
    onDelete: e => dispatch(deleteStep()),
    onCancel: e => dispatch(cancelMoreOptionsModal()),
    onSave: e => dispatch(saveMoreOptionsModal()),

    handleChange: (accessor: string) => (e: SyntheticEvent<HTMLInputElement>) => {
      if (typeof e.target.value === 'string' || typeof e.target.value === 'boolean') {
        // TODO Ian 2018-02-07 remove this flow typechecking cruft
        // NOTE this is similar to ConnectedStepEdit form, is it possible to make a more general reusable fn?
        dispatch(changeMoreOptionsModalInput({accessor, value: e.target.value}))
      } else {
        console.warn('handleChange got value of wrong type')
      }
    },

    onClickAway: e => dispatch(cancelMoreOptionsModal())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MoreOptionsModal)
