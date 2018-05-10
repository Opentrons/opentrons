// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import {
  changeFormInput,
  cancelStepForm,
  saveStepForm,
  collapseFormSection,
  openMoreOptionsModal
} from '../steplist/actions' // TODO use steplist/index.js

import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {selectors} from '../steplist/reducers' // TODO use steplist/index.js
import {selectors as fileDataSelectors} from '../file-data'
import type {FormData} from '../form-types'
import type {BaseState, ThunkDispatch} from '../types'

import StepEditForm, {type Props as StepEditFormProps} from '../components/StepEditForm'

type Props = {
  ...StepEditFormProps,
  formData?: FormData
}

function StepEditFormWrapper (props: Props) {
  // don't render StepEditForm unless there is formData available
  if (props.formData) {
    return <StepEditForm {...props} />
  }
  return null
}

function mapStateToProps (state: BaseState) {
  return {
    formData: selectors.formData(state),
    formSectionCollapse: selectors.formSectionCollapse(state),
    canSave: selectors.currentFormCanBeSaved(state),
    pipetteOptions: fileDataSelectors.equippedPipetteOptions(state),
    labwareOptions: labwareIngredSelectors.labwareOptions(state)
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>) {
  return {
    onCancel: () => dispatch(cancelStepForm()),
    onSave: () => dispatch(saveStepForm()),
    onClickMoreOptions: () => dispatch(openMoreOptionsModal()),
    onToggleFormSection: (section) => () => dispatch(collapseFormSection(section)),
    handleChange: (accessor: string) => (e: SyntheticEvent<HTMLInputElement> | SyntheticEvent<HTMLSelectElement>) => {
      // TODO Ian 2018-01-26 factor this nasty type handling out
      const dispatchEvent = value => dispatch(changeFormInput({update: {[accessor]: value}}))

      if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
        dispatchEvent(e.target.checked)
      } else if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        dispatchEvent(e.target.value)
      }
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepEditFormWrapper)
