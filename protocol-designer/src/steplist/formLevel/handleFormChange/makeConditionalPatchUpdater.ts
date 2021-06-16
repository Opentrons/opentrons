export type FieldUpdateMaps = Array<{
  prevValue: unknown
  nextValue: unknown
  dependentFields: Array<{
    name: string
    prevValue: unknown
    nextValue: unknown
  }>
}>
// the "value" in the outer prevValue/nextValue can be a field value,
// or derived from the form (example in Move Liquid form: "well ratio" is
// derived from aspirate_wells + dispense_wells).
//
// This style of updater is useful when the previous independent value matters
type MakeConditionalPatchUpdater = (
  updateMaps: FieldUpdateMaps
) => (
  prevValue: unknown,
  nextValue: unknown,
  dependentFields: { [value: string]: unknown }
) => {}
export const makeConditionalPatchUpdater: MakeConditionalPatchUpdater = updateMaps => (
  prevValue,
  nextValue,
  dependentFields
) => {
  // get relevant update map (if any) via key values
  const updateMap = updateMaps.find(
    u => u.prevValue === prevValue && u.nextValue === nextValue
  )

  if (!updateMap) {
    console.warn(
      `expected prevValue "${String(prevValue)}" and nextValue "${String(
        nextValue
      )}" in update maps`
    )
    return {}
  }

  const fieldUpdates = updateMap.dependentFields
  return fieldUpdates.reduce((patchAcc, { name, prevValue, nextValue }) => {
    return dependentFields[name] !== undefined &&
      dependentFields[name] === prevValue
      ? { ...patchAcc, [name]: nextValue }
      : patchAcc
  }, {})
}
