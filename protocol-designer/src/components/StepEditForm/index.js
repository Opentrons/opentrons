// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import get from 'lodash/get'
import without from 'lodash/without'
import cx from 'classnames'

import {actions, selectors} from '../../steplist'
import type {FormData, StepType, StepFieldName, StepIdType} from '../../form-types'
import type {BaseState, ThunkDispatch} from '../../types'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'
import FormAlerts from './FormAlerts'
import MixForm from './MixForm'
import TransferLikeForm from './TransferLikeForm'
import PauseForm from './PauseForm'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import ButtonRow from './ButtonRow'

type StepForm = typeof MixForm | typeof PauseForm | typeof TransferLikeForm
const STEP_FORM_MAP: {[StepType]: StepForm} = {
  mix: MixForm,
  pause: PauseForm,
  transfer: TransferLikeForm,
  consolidate: TransferLikeForm,
  distribute: TransferLikeForm,
}

export type FocusHandlers = {
  focusedField: StepFieldName,
  dirtyFields: Array<StepFieldName>,
  onFieldFocus: (StepFieldName) => void,
  onFieldBlur: (StepFieldName) => void,
}

type SP = {
  formData?: ?FormData,
  isNewStep?: boolean,
}
type DP = { deleteStep: (StepIdType) => mixed }

type StepEditFormState = {
  showConfirmDeleteModal: boolean,
  focusedField: StepFieldName | null,
  dirtyFields: Array<StepFieldName>,
}

type Props = SP & DP

// TODO: type fieldNames, don't use `any`
const getDirtyFields = (isNewStep: ?boolean, formData: ?FormData): Array<any> => (
  isNewStep ? [] : without(Object.keys(formData || {}), 'stepType', 'id')
)

class StepEditForm extends React.Component<Props, StepEditFormState> {
  constructor (props: Props) {
    super(props)
    const {isNewStep, formData} = props
    this.state = {
      showConfirmDeleteModal: false,
      focusedField: null,
      dirtyFields: getDirtyFields(isNewStep, formData),
    }
  }

  componentDidUpdate (prevProps) {
    // NOTE: formData is sometimes undefined between steps
    if (get(this.props, 'formData.id') !== get(prevProps, 'formData.id')) {
      const {isNewStep, formData} = this.props
      this.setState({ focusedField: null, dirtyFields: getDirtyFields(isNewStep, formData) })
    }
  }

  onFieldFocus = (fieldName: StepFieldName) => { this.setState({focusedField: fieldName}) }

  onFieldBlur = (fieldName: StepFieldName) => {
    this.setState((prevState) => ({
      ...prevState,
      focusedField: (fieldName === prevState.focusedField) ? null : prevState.focusedField,
      dirtyFields: prevState.dirtyFields.includes(fieldName) ? prevState.dirtyFields : [...prevState.dirtyFields, fieldName],
    }))
  }

  toggleConfirmDeleteModal = () => {
    this.setState({
      showConfirmDeleteModal: !this.state.showConfirmDeleteModal,
    })
  }

  render () {
    if (!this.props.formData) return null // early-exit if connected formData is absent
    const {formData, deleteStep} = this.props
    // TODO: FormComponent should be type ?StepForm. That also requires making focusedField prop consistently allow null
    const FormComponent: any = get(STEP_FORM_MAP, formData.stepType)
    if (!FormComponent) { // early-exit if step form doesn't exist
      return <div className={formStyles.form}><div>Todo: support {formData && formData.stepType} step</div></div>
    }
    return (
      <React.Fragment>
        {this.state.showConfirmDeleteModal && <ConfirmDeleteModal
          onCancelClick={this.toggleConfirmDeleteModal}
          onContinueClick={() => {
            this.toggleConfirmDeleteModal()
            this.props.formData && deleteStep(this.props.formData.id)
          }}
        />}
        <div className={cx(formStyles.form, styles[formData.stepType])}>
          <FormAlerts focusedField={this.state.focusedField} dirtyFields={this.state.dirtyFields} />
          <FormComponent
            stepType={formData.stepType}
            focusHandlers={{
              focusedField: this.state.focusedField,
              dirtyFields: this.state.dirtyFields,
              onFieldFocus: this.onFieldFocus,
              onFieldBlur: this.onFieldBlur,
            }} />
          <ButtonRow onDelete={this.toggleConfirmDeleteModal}/>
        </div>
      </React.Fragment>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  formData: selectors.getUnsavedForm(state),
  isNewStep: selectors.getIsNewStepForm(state),
})

const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DP => ({
  deleteStep: (stepId: StepIdType) => dispatch(actions.deleteStep(stepId)),
})

export default connect(mapStateToProps, mapDispatchToProps)(StepEditForm)
