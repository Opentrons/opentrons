// @flow

export type FieldUpdateMaps = Array<{
  prevValue: mixed,
  nextValue: mixed,
  dependentFields: Array<{name: string, prevValue: mixed, nextValue: mixed}>,
}>

// A "key value" is a value derived from one or more fields, which can trigger
// other fields to change when it changes
// (example in Move Liquid form: "well ratio" is derived
// from aspirate_wells + dispense_wells).
// This style of updater assumes that the previous key value matters
const makeConditionalFieldUpdater = (updateMaps: FieldUpdateMaps) =>
  (prevValue: mixed, nextValue: mixed, dependentFields: Object) => {
    // get relevant update map (if any) via key values
    const updateMap = updateMaps.find(u =>
      u.prevValue === prevValue &&
      u.nextValue === nextValue)
    if (!updateMap) {
      console.warn(`expected ${String(prevValue)} and ${String(nextValue)} in update maps`)
      return {}
    }
    const fieldUpdates = updateMap.dependentFields
    return fieldUpdates.reduce((patchAcc, {name, prevValue, nextValue}) => {
      return dependentFields[name] !== undefined && dependentFields[name] === prevValue
        ? {...patchAcc, [name]: nextValue}
        : patchAcc
    }, {})
  }

export default makeConditionalFieldUpdater
