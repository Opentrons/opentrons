// @flow

export type FieldUpdateMaps = Array<{
  prevKeyValue: mixed,
  nextKeyValue: mixed,
  fields: Array<{name: string, prev: mixed, next: mixed}>,
}>

// A "key value" is a value derived from one or more fields, which can trigger
// other fields to change when it changes
// (examples in Move Liquid form:
// "well ratio" is derived from aspirate_wells + dispense_wells,
// and "path" is a single field that acts as a key value)
const makeFieldUpdater = (updateMaps: FieldUpdateMaps) =>
  (prevKeyValue: mixed, nextKeyValue: mixed, fields: Object) => {
    const updateForKeyChange = updateMaps.find(u =>
      u.prevKeyValue === prevKeyValue &&
      u.nextKeyValue === nextKeyValue)
    if (!updateForKeyChange) {
      console.warn(`expected ${String(prevKeyValue)} and ${String(nextKeyValue)} in update maps`)
      return {}
    }
    const fieldUpdates = updateForKeyChange.fields
    return fieldUpdates.reduce((patchAcc, {name, prev, next}) => {
      return fields[name] !== undefined && fields[name] === prev
        ? {...patchAcc, [name]: next}
        : patchAcc
    }, {})
  }

export default makeFieldUpdater
