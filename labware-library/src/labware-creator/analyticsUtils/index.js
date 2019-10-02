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
