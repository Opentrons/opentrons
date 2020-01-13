// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import without from 'lodash/without'
import cx from 'classnames'

import { actions } from '../../steplist'
import { selectors as stepFormSelectors } from '../../step-forms'
import type {
  FormData,
  StepType,
  StepFieldName,
  StepIdType,
} from '../../form-types'
import type { BaseState, ThunkDispatch } from '../../types'
import getDefaultsForStepType from '../../steplist/formLevel/getDefaultsForStepType.js'
import formStyles from '../forms/forms.css'
import MoreOptionsModal from '../modals/MoreOptionsModal'
import ConfirmDeleteStepModal from '../modals/ConfirmDeleteStepModal'
import styles from './StepEditForm.css'

import {
  MixForm,
  MoveLiquidForm,
  PauseForm,
  MagnetForm,
  TemperatureForm,
} from './forms'
import { FormAlerts } from './FormAlerts'
import { ButtonRow } from './ButtonRow'

const STEP_FORM_MAP: { [StepType]: * } = {
  mix: MixForm,
  pause: PauseForm,
  moveLiquid: MoveLiquidForm,
  magnet: MagnetForm,
  temperature: TemperatureForm,
}

type SP = {|
  formData?: ?FormData,
  isNewStep?: boolean,
|}

type DP = {| deleteStep: StepIdType => mixed |}

type StepEditFormState = {
  showConfirmDeleteModal: boolean,
  showMoreOptionsModal: boolean,
  focusedField: StepFieldName | null,
  dirtyFields: Array<StepFieldName>,
}

type Props = { ...SP, ...DP }

// TODO: type fieldNames, don't use `any`
const getDirtyFields = (
  isNewStep: ?boolean,
  formData: ?FormData
): Array<any> => {
  let dirtyFields = []
  if (!isNewStep && formData) {
    dirtyFields = Object.keys(formData)
  } else if (formData && formData.stepType) {
    const data = formData
    // new step, but may have auto-populated fields.
    // "Dirty" any fields that differ from default new form values
    const defaultFormData = getDefaultsForStepType(formData.stepType)
    dirtyFields = Object.keys(defaultFormData).reduce(
      (acc, fieldName: StepFieldName) => {
        // formData is no longer a Maybe type b/c of the `if` above, but flow forgets
        const currentValue = data[fieldName]
        const initialValue = defaultFormData[fieldName]

        return isEqual(currentValue, initialValue) ? acc : [...acc, fieldName]
      },
      []
    )
  }
  // exclude form "metadata" (not really fields)
  return without(dirtyFields, 'stepType', 'id')
}

class StepEditForm extends React.Component<Props, StepEditFormState> {
  constructor(props: Props) {
    super(props)
    const { isNewStep, formData } = props
    this.state = {
      showConfirmDeleteModal: false,
      showMoreOptionsModal: false,
      focusedField: null,
      dirtyFields: getDirtyFields(isNewStep, formData),
    }
  }

  componentDidUpdate(prevProps: Props) {
    // NOTE: formData is sometimes undefined between steps
    if (get(this.props, 'formData.id') !== get(prevProps, 'formData.id')) {
      const { isNewStep, formData } = this.props
      this.setState({
        focusedField: null,
        dirtyFields: getDirtyFields(isNewStep, formData),
      })
    }
  }

  onFieldFocus = (fieldName: StepFieldName) => {
    this.setState({ focusedField: fieldName })
  }

  onFieldBlur = (fieldName: StepFieldName) => {
    this.setState(prevState => ({
      ...prevState,
      focusedField:
        fieldName === prevState.focusedField ? null : prevState.focusedField,
      dirtyFields: prevState.dirtyFields.includes(fieldName)
        ? prevState.dirtyFields
        : [...prevState.dirtyFields, fieldName],
    }))
  }

  toggleConfirmDeleteModal = () => {
    this.setState({
      showConfirmDeleteModal: !this.state.showConfirmDeleteModal,
    })
  }

  toggleMoreOptionsModal = () => {
    this.setState({
      showMoreOptionsModal: !this.state.showMoreOptionsModal,
    })
  }

  render() {
    if (!this.props.formData) return null // early-exit if connected formData is absent
    const { formData, deleteStep } = this.props
    // TODO: FormComponent should be type ?StepForm. That also requires making focusedField prop consistently allow null
    const FormComponent: any = get(STEP_FORM_MAP, formData.stepType)
    if (!FormComponent) {
      // early-exit if step form doesn't exist
      return (
        <div className={formStyles.form}>
          <div>Todo: support {formData && formData.stepType} step</div>
        </div>
      )
    }
    return (
      <React.Fragment>
        {this.state.showConfirmDeleteModal && (
          <ConfirmDeleteStepModal
            onCancelClick={this.toggleConfirmDeleteModal}
            onContinueClick={() => {
              this.toggleConfirmDeleteModal()
              this.props.formData && deleteStep(this.props.formData.id)
            }}
          />
        )}
        {this.state.showMoreOptionsModal && (
          <MoreOptionsModal
            formData={formData}
            close={this.toggleMoreOptionsModal}
          />
        )}
        <FormAlerts
          focusedField={this.state.focusedField}
          dirtyFields={this.state.dirtyFields}
        />
        <div className={cx(formStyles.form, styles[formData.stepType])}>
          <FormComponent
            stepType={formData.stepType} // TODO: Ian 2019-01-17 deprecate passing this during #2916, it's in formData
            formData={formData}
            focusHandlers={{
              focusedField: this.state.focusedField,
              dirtyFields: this.state.dirtyFields,
              onFieldFocus: this.onFieldFocus,
              onFieldBlur: this.onFieldBlur,
            }}
          />
          <ButtonRow
            onClickMoreOptions={this.toggleMoreOptionsModal}
            onDelete={this.toggleConfirmDeleteModal}
          />
        </div>
      </React.Fragment>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  formData: stepFormSelectors.getUnsavedForm(state),
  isNewStep: stepFormSelectors.getIsNewStepForm(state),
})

const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DP => ({
  deleteStep: (stepId: StepIdType) => dispatch(actions.deleteStep(stepId)),
})

export default connect<Props, {||}, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(StepEditForm)
