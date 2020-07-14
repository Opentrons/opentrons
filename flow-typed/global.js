// @flow
// global utility types

// takes an object type Obj and returns an object type where all
// keys are marked as possibly `void`
export type $Partial<Obj: { ... }> = $Shape<$ObjMap<Obj, <V>(V) => V | void>>
