// @flow
import { connect } from 'react-redux'
import { Alerts, type Props } from '../alerts/Alerts'
import {
  actions as dismissActions,
  selectors as dismissSelectors,
} from '../../dismiss'
import { getVisibleAlerts } from './utils'
import { getSelectedStepId } from '../../ui/steps'
import { selectors as stepFormSelectors } from '../../step-forms'
import type { Dispatch } from 'redux'
import type { StepIdType } from '../../form-types'
import type { StepFieldName } from '../../steplist/fieldLevel'
import type { BaseState } from '../../types'

/* TODO:  BC 2018-09-13 move to src/components/alerts and adapt and use src/components/alerts/Alerts
 * see #1814 for reference
 */

type SP = {|
  errors: $PropertyType<Props, 'errors'>,
  warnings: $PropertyType<Props, 'warnings'>,
  stepId: ?(StepIdType | string),
|}

type OP = {|
  focusedField: ?StepFieldName,
  dirtyFields: Array<StepFieldName>,
|}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { focusedField, dirtyFields } = ownProps
  const visibleWarnings = getVisibleAlerts({
    focusedField,
    dirtyFields,
    alerts: dismissSelectors.getFormWarningsForSelectedStep(state),
  })

  const unsavedFormErrors = stepFormSelectors.getUnsavedFormErrors(state)
  const formLevelErrors = (unsavedFormErrors && unsavedFormErrors.form) || []
  const filteredErrors = getVisibleAlerts({
    focusedField,
    dirtyFields,
    alerts: formLevelErrors,
  })

  return {
    errors: filteredErrors.map(error => ({
      title: error.title,
      description: error.body || null,
    })),
    warnings: visibleWarnings.map(warning => ({
      title: warning.title,
      description: warning.body || null,
      dismissId: warning.type,
    })),
    stepId: getSelectedStepId(state),
  }
}

const mergeProps = (
  stateProps: SP,
  dispatchProps: { dispatch: Dispatch<*> }
): Props => {
  const { stepId } = stateProps
  const { dispatch } = dispatchProps
  return {
    ...stateProps,
    dismissWarning: (dismissId: string) => {
      dispatch(dismissActions.dismissFormWarning({ type: dismissId, stepId }))
    },
  }
}

export const FormAlerts = connect<Props, OP, SP, {||}, _, _>(
  mapStateToProps,
  null,
  mergeProps
)(Alerts)
