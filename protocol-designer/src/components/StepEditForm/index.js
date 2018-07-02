// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import get from 'lodash/get'
import without from 'lodash/without'
import cx from 'classnames'

import {selectors, actions} from '../../steplist'
import type {StepFieldName} from '../../steplist/fieldLevel'
import type {FormData, StepType} from '../../form-types'
import type {BaseState, ThunkDispatch} from '../../types'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'
import FormAlerts from './FormAlerts'
import MixForm from './MixForm'
import TransferLikeForm from './TransferLikeForm'
import PauseForm from './PauseForm'
import ButtonRow from './ButtonRow'
import ConfirmDeleteModal from './ConfirmDeleteModal'

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
type DP = {onDelete: () => mixed}
type StepEditFormState = {
  showConfirmDeleteModal: boolean,
  focusedField: StepFieldName | null,
  dirtyFields: Array<StepFieldName>
}
type Props = SP & DP

class StepEditForm extends React.Component<Props, StepEditFormState> {
  constructor (props) {
    super(props)
    this.state = {
      showConfirmDeleteModal: false,
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
      ...prevState,
      focusedField: (fieldName === prevState.focusedField) ? null : prevState.focusedField,
      dirtyFields: prevState.dirtyFields.includes(fieldName) ? prevState.dirtyFields : [...prevState.dirtyFields, fieldName]
    }))
  }

  toggleConfirmDeleteModal = () => {
    this.setState({
      showConfirmDeleteModal: !this.state.showConfirmDeleteModal
    })
  }

  render () {
    if (!this.props.formData) return null // early-exit if connected formData is absent
    const {formData, onDelete} = this.props
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
            onDelete()
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
              onFieldBlur: this.onFieldBlur
            }} />
          <ButtonRow toggleConfirmDeleteModal={this.toggleConfirmDeleteModal}/>
        </div>
      </React.Fragment>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  formData: selectors.formData(state),
  isNewStep: selectors.isNewStepForm(state)
})

const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DP => ({ onDelete: () => dispatch(actions.deleteStep()) })

export default connect(mapStateToProps, mapDispatchToProps)(StepEditForm)
