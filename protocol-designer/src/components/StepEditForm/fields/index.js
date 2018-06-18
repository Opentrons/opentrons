// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import {actions, selectors} from '../../steplist' // TODO use steplist/index.js
import type {FormData, StepType} from '../../../form-types'
import type {BaseState, ThunkDispatch} from '../../types'

type connectFieldParams = {
  formData: Object
}

type internalSP = {value: $Values<F>}
type internalDP = {onChange: (e: SyntheticInputEvent<*>) => mixed}

type HOC = (React.ComponentType<any>) => React.ComponentType<any>
const connectField = (fieldName: string): HOC => {
  return (FieldComponent) => {
    const STP = (state: BaseState): internalSP => ({
      value: selectors.formData(state)[fieldName] || ''
    })

    const DTP = (dispatch: ThunkDispatch<*>): internalDP => ({
      onChange: (e: SyntheticEvent<HTMLInputElement> | SyntheticEvent<HTMLSelectElement>) => {
        // TODO Ian 2018-01-26 factor this nasty type handling out
        const dispatchEvent = value => dispatch(actions.changeFormInput({update: {[fieldName]: value}}))
        if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
          dispatchEvent(e.target.checked)
        } else if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
          dispatchEvent(e.target.value)
        }
      }

    })
    const ConnectedFieldComponent = connect(STP, DTP)(FieldComponent)
    return (
      <ConnectedFieldComponent
        value={form}
        onBlur/>
    )
  }
}

export default connectField