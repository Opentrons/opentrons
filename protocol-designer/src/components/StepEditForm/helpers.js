// @flow
import difference from 'lodash/difference'

export function getVisibleAlerts<Field, Alert: {dependentFields: Array<Field>}> (args: {
  focusedField: ?Field,
  dirtyFields: Array<Field>,
  alerts: Array<Alert>,
}): Array<Alert> {
  const {focusedField, dirtyFields, alerts} = args
  return alerts.filter(alert => (
    !alert.dependentFields.includes(focusedField) &&
    difference(alert.dependentFields, dirtyFields).length === 0)
  )
}
