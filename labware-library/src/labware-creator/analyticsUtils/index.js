// @flow
import { reportEvent } from '../../analytics'

const _prevFieldValues = {}
export const reportFieldEdit = (args: {| name: string, value: string |}) => {
  // avoid reporting events on field blur unless there's a change
  const { name, value } = args
  const prevValue = _prevFieldValues[name]
  if (prevValue === undefined || prevValue !== value) {
    reportEvent({
      name: 'labwareCreatorFieldEdit',
      properties: { value, name },
    })
  }
  _prevFieldValues[name] = value
}

let _prevErrors: { [string]: string } = {}
export const reportErrors = (args: {|
  values: Object,
  errors: Object,
  touched: Object,
|}) => {
  const { values, errors, touched } = args

  // TODO Ian 2019-10-02: why is there an 'undefined' field in Formik `touched`?
  const dirtyFieldNames = Object.keys(touched).filter(
    name => touched[name] && name !== 'undefined'
  )
  const activeErrors = dirtyFieldNames.reduce(
    (acc, name) => (errors[name] ? { ...acc, [name]: errors[name] } : acc),
    {}
  )

  const newErrors = Object.keys(activeErrors).reduce((acc, name) => {
    const prev = _prevErrors[name]
    return prev === undefined || prev !== activeErrors[name]
      ? { ...acc, [name]: activeErrors[name] }
      : acc
  }, {})
  _prevErrors = newErrors

  if (Object.keys(newErrors).length > 0) {
    Object.keys(newErrors).forEach(name => {
      reportEvent({
        name: 'labwareCreatorAlertDisplay',
        properties: {
          alertContent: newErrors[name],
          alertField: name,
          alertValue: values[name],
        },
      })
    })
  }
}
