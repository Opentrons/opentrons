// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { Alerts, type Props } from '../alerts/Alerts'
import {
  actions as dismissActions,
  selectors as dismissSelectors,
} from '../../dismiss'
import { getSelectedStepId } from '../../ui/steps'
import { selectors as stepFormSelectors } from '../../step-forms'
import {
  formErrorToAlertData,
  getVisibleFormErrors,
  getVisibleFormWarnings,
  getVisibleProfileFormLevelErrors,
} from './utils'
import type { Dispatch } from 'redux'
import type { StepIdType } from '../../form-types'
import type { StepFieldName } from '../../steplist/fieldLevel'
import type { BaseState } from '../../types'
import type { AlertData } from '../alerts/types'
import type { ProfileFormError } from '../../steplist/formLevel/profileErrors'

type SP = {|
  errors: Array<AlertData>,
  warnings: Array<AlertData>,
  stepId?: ?StepIdType,
|}

type OP = {|
  focusedField: ?StepFieldName,
  dirtyFields: Array<StepFieldName>,
|}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { focusedField, dirtyFields } = ownProps
  const visibleWarnings = getVisibleFormWarnings({
    focusedField,
    dirtyFields,
    errors: dismissSelectors.getFormWarningsForSelectedStep(state),
  })

  const formLevelErrors = stepFormSelectors.getFormLevelErrorsForUnsavedForm(
    state
  )
  const visibleErrors = getVisibleFormErrors({
    focusedField,
    dirtyFields,
    errors: formLevelErrors,
  })

  // deal with special-case dynamic field form-level errors
  const { profileItemsById } = stepFormSelectors.getHydratedUnsavedForm(state)
  let visibleDynamicFieldFormErrors: Array<ProfileFormError> = []
  if (profileItemsById != null) {
    const dynamicFieldFormErrors = stepFormSelectors.getDynamicFieldFormErrorsForUnsavedForm(
      state
    )
    visibleDynamicFieldFormErrors = getVisibleProfileFormLevelErrors({
      focusedField,
      dirtyFields,
      errors: dynamicFieldFormErrors,
      profileItemsById,
    })
  }

  const errors: Array<AlertData> = [
    ...visibleErrors.map(formErrorToAlertData),
    ...visibleDynamicFieldFormErrors.map(formErrorToAlertData),
  ]

  const warnings: Array<AlertData> = visibleWarnings.map(warning => ({
    title: warning.title,
    description: warning.body || null,
    dismissId: warning.type,
  }))

  return {
    errors,
    warnings,
    stepId: getSelectedStepId(state),
  }
}

const mergeProps = (
  stateProps: SP,
  dispatchProps: { dispatch: Dispatch<*> }
): Props => {
  const { stepId, errors, warnings } = stateProps
  const { dispatch } = dispatchProps
  return {
    errors,
    warnings,
    dismissWarning: (dismissId: string) => {
      if (stepId)
        dispatch(dismissActions.dismissFormWarning({ type: dismissId, stepId }))
    },
  }
}

export const FormAlerts: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  {||},
  _,
  _
>(
  mapStateToProps,
  null,
  mergeProps
)(Alerts)
