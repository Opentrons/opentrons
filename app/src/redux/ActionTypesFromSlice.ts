/**
 * A utility for extracting action types from a Redux Toolkit slice.
 *
 * For example:
 *
 *   const fooSlice = createSlice(...)
 *   export type FooAction = ActionTypesFromSlice<typeof fooSlice.actions>
 */
export type ActionTypesFromSlice<ActionsObject> = {
  [Key in keyof ActionsObject]: ActionsObject[Key] extends (
    ...args: any[]
  ) => infer Return
    ? Return
    : never
}[keyof ActionsObject]
