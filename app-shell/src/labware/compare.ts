// TODO(bc, 2021-02-22): this function needs to be rewritten to satisfy how TS prefers to
// consume the `CheckedLabwareFile` union type. revisit once `app/src` is all in TS

export function sameIdentity(a: any, b: any): boolean {
  return (
    a.definition != null &&
    b.definition != null &&
    a.definition.parameters.loadName === b.definition.parameters.loadName &&
    a.definition.version === b.definition.version &&
    a.definition.namespace === b.definition.namespace
  )
}
