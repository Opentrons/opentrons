// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import difference from 'lodash/difference'
import {AlertItem} from '@opentrons/components'
import type {StepIdType} from '../../form-types'
import {selectors as steplistSelectors} from '../../steplist'
import {END_STEP} from '../../steplist/types'
import {type StepFieldName} from '../../steplist/fieldLevel'
import type {FormError, FormWarning, FormWarningKey} from '../../steplist/formLevel'
import Alerts from '../Alerts'
import type {BaseState} from '../../types'

type SP = {errors: Array<FormError>, warnings: Array<FormWarning>, _stepId: ?StepIdType | typeof END_STEP}
type OP = {focusedField: ?StepFieldName, dirtyFields: Array<StepFieldName>}
type FormAlertsProps = {
  errors: Array<FormError>,
  warnings: Array<FormWarning>,
  onDismiss: (FormWarningKey) => () => void
}

const FormAlerts = (props: FormAlertsProps) => (
  <React.Fragment>
    {props.errors.map((error, index) => (
      <AlertItem
        type="warning"
        key={index}
        title={error.title || error.message}>
        {error.title ? error.message : null}
      </AlertItem>
    ))}
    {props.warnings.map((warning, index) => (
      <AlertItem
        type="warning"
        key={index}
        title={warning.title || warning.message}
        onCloseClick={props.onDismiss(warning.warningId)}>
        {warning.title ? warning.message : null}
      </AlertItem>
    ))}
  </React.Fragment>
)

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const errors = steplistSelectors.formLevelErrors(state)
  const warnings = steplistSelectors.formLevelWarnings(state)
  const _stepId = steplistSelectors.selectedStepId(state)

  const {focusedField, dirtyFields} = ownProps
  // const showWarnings = (process.env.OT_PD_SHOW_WARNINGS === 'true') // hide warnings without explicit FEATURE FLAG
  // if (!showWarnings) return {errors: [], warnings: [], _stepId}
  const filteredErrors = errors
    ? errors.filter(e => (!e.dependentFields.includes(focusedField) && difference(e.dependentFields, dirtyFields).length === 0))
    : []
  const filteredWarnings = warnings
    ? warnings.filter(w => (!w.dependentFields.includes(focusedField) && difference(w.dependentFields, dirtyFields).length === 0))
    : []
  return {errors: filteredErrors, warnings: filteredWarnings, _stepId}
}

const mergeProps = (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}): FormAlertsProps => {
  const onDismiss = (warningId: FormWarningKey) => () => console.log('dismiss warning here', warningId, stateProps._stepId)
  // TODO: un-comment after Ian's dismiss reducer is merged
  // const onDismiss = (warning: CommandCreatorWarning) =>
  // () => dispatch(dismissActions.dismissWarning({
  //   warning,
  //   stepId: stateProps._stepId
  // }))
  return {
    ...stateProps,
    onDismiss
  }
}

export default connect(mapStateToProps, null, mergeProps)(FormAlerts)
