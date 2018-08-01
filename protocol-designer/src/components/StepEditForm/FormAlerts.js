// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {AlertItem} from '@opentrons/components'
import {actions as dismissActions, selectors as dismissSelectors} from '../../dismiss'
import {getVisibleAlerts} from './helpers'
import type {StepIdType} from '../../form-types'
import {selectors as steplistSelectors} from '../../steplist'
import type {StepFieldName} from '../../steplist/fieldLevel'
import type {FormError, FormWarning} from '../../steplist/formLevel'
import type {BaseState} from '../../types'

type SP = {
  errors: Array<FormError>,
  warnings: Array<FormWarning>,
  stepId: ?(StepIdType | string)
}
type DP = {
  dismissWarning: (FormWarning, $PropertyType<SP, 'stepId'>) => mixed
}
type OP = {
  focusedField: ?StepFieldName,
  dirtyFields: Array<StepFieldName>
}
type FormAlertsProps = SP & DP

class FormAlerts extends React.Component<FormAlertsProps> {
  makeHandleCloseWarning = (warning: FormWarning) => () => {
    this.props.dismissWarning(warning, this.props.stepId)
  }

  render () {
    return (
      <React.Fragment>
        {this.props.errors.map((error, index) => (
          <AlertItem
            type="warning"
            key={index}
            title={error.title}
          >
            {error.body}
          </AlertItem>
        ))}
        {this.props.warnings.map((warning, index) => (
          <AlertItem
            type="warning"
            key={index}
            title={warning.title}
            onCloseClick={this.makeHandleCloseWarning(warning)}
          >
            {warning.body}
          </AlertItem>
        ))}
      </React.Fragment>
    )
  }
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const {focusedField, dirtyFields} = ownProps
  const visibleWarnings = getVisibleAlerts({
    focusedField,
    dirtyFields,
    alerts: dismissSelectors.getFormWarningsForSelectedStep(state)
  })

  const errors = steplistSelectors.formLevelErrors(state)
  const filteredErrors = getVisibleAlerts({
    focusedField,
    dirtyFields,
    alerts: errors
  })

  return {
    errors: filteredErrors,
    warnings: visibleWarnings,
    stepId: steplistSelectors.getSelectedStepId(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch<*>): DP => ({
  dismissWarning: (warning, stepId) => {
    if (typeof stepId === 'string') {
      // TODO: Ian 2018-07-13 remove this conditional once stepIds are always numbers
      console.warn(`Tried to dismiss form-level warning for "special" stepId ${stepId}`)
      return
    }
    if (stepId == null) {
      console.warn('Tried to dismiss form-level warning with no stepId.')
      return
    }
    dispatch(dismissActions.dismissFormWarning({warning, stepId}))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(FormAlerts)
