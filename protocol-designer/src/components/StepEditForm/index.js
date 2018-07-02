// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import get from 'lodash/get'
import without from 'lodash/without'
import cx from 'classnames'

import {selectors} from '../../steplist'
import type {StepFieldName} from '../../steplist/fieldLevel'
import type {FormData, StepType} from '../../form-types'
import type {BaseState} from '../../types'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'
import FormAlerts from './FormAlerts'
import MixForm from './MixForm'
import TransferLikeForm from './TransferLikeForm'
import PauseForm from './PauseForm'
import ButtonRow from './ButtonRow'

type StepForm = typeof MixForm | typeof PauseForm | typeof TransferLikeForm
const STEP_FORM_MAP: {[StepType]: StepForm} = {
  mix: MixForm,
  pause: PauseForm,
  transfer: TransferLikeForm,
  consolidate: TransferLikeForm,
  distribute: TransferLikeForm
}

export type FocusHandlers = {
  focusedField: StepFieldName,
  dirtyFields: Array<StepFieldName>,
  onFieldFocus: (StepFieldName) => void,
  onFieldBlur: (StepFieldName) => void
}

type SP = {
  formData?: ?FormData,
  isNewStep?: boolean
}
type StepEditFormState = {
  focusedField: StepFieldName | null,
  dirtyFields: Array<StepFieldName>
}

class StepEditForm extends React.Component<SP, StepEditFormState> {
  constructor (props) {
    super(props)
    this.state = {
      focusedField: null,
      dirtyFields: [] // TODO: initialize to dirty if not new form
    }
  }

  componentDidUpdate (prevProps) {
    // NOTE: formData is sometimes undefined between steps
    if (get(this.props, 'formData.id') !== get(prevProps, 'formData.id')) {
      if (this.props.isNewStep) {
        this.setState({ focusedField: null, dirtyFields: [] })
      } else {
        const fieldNames: Array<string> = without(Object.keys(this.props.formData || {}), 'stepType', 'id')
        // $FlowFixMe
        this.setState({focusedField: null, dirtyFields: fieldNames})
      }
    }
  }

  onFieldFocus = (fieldName: StepFieldName) => { this.setState({focusedField: fieldName}) }

  onFieldBlur = (fieldName: StepFieldName) => {
    this.setState((prevState) => ({
      focusedField: (fieldName === prevState.focusedField) ? null : prevState.focusedField,
      dirtyFields: prevState.dirtyFields.includes(fieldName) ? prevState.dirtyFields : [...prevState.dirtyFields, fieldName]
    }))
  }

  render () {
    if (!this.props.formData) return null // early-exit if connected formData is absent
    const {formData} = this.props
    const FormComponent: any = get(STEP_FORM_MAP, formData.stepType)
    if (!FormComponent) { // early-exit if step form doesn't exist
      return <div className={formStyles.form}><div>Todo: support {formData && formData.stepType} step</div></div>
    }
    return (
      <div className={cx(formStyles.form, styles[formData.stepType])}>
        <FormAlerts focusedField={this.state.focusedField} dirtyFields={this.state.dirtyFields} />
        <FormComponent
          stepType={formData.stepType}
          focusHandlers={{
            focusedField: this.state.focusedField,
            dirtyFields: this.state.dirtyFields,
            onFieldFocus: this.onFieldFocus,
            onFieldBlur: this.onFieldBlur
          }} />
        <ButtonRow />
      </div>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  formData: selectors.formData(state),
  isNewStep: selectors.isNewStepForm(state)
})

export default connect(mapStateToProps)(StepEditForm)
