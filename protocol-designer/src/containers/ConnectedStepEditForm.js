// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'

import {changeFormInput, cancelStepForm, saveStepForm} from '../steplist/actions' // TODO use steplist/index.js
import {selectors} from '../steplist/reducers' // TODO use steplist/index.js
import type {FormData} from '../steplist/types'

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

function mapStateToProps (state) {
  return {
    formData: selectors.formData(state),
    canSave: selectors.currentFormCanBeSaved(state),
    pipetteOptions: [
      {name: '10 μL Single', value: '10-single'}, /* TODO: should be 'p10 single'? What 'value'? */
      {name: '300 μL Single', value: '300-single'},
      {name: '10 μL Multi-Channel', value: '10-multi'},
      {name: '300 μL Multi-Channel', value: '300-multi'}
    ],
    labwareOptions: [
      {name: 'Source Plate', value: 'sourcePlateId'}, /* TODO: get labware with selector, not hard-coded! */
      {name: 'Dest Plate', value: 'destPlateId'},
      {name: 'Trough with very long name', value: 'troughId'}
    ]
  }
}

function mapDispatchToProps (dispatch: Dispatch<any>) {
  return {
    onCancel: e => dispatch(cancelStepForm()),
    onSave: e => dispatch(saveStepForm()),
    handleChange: (accessor: string) => (e: SyntheticEvent<HTMLInputElement> | SyntheticEvent<HTMLSelectElement>) => {
      // TODO Ian 2018-01-26 factor this nasty type handling out
      const dispatchEvent = value => dispatch(changeFormInput({accessor, value}))

      if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
        dispatchEvent(e.target.checked)
      } else if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        dispatchEvent(e.target.value)
      }
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepEditFormWrapper)
