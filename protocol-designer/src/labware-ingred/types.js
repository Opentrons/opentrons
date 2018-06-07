// @flow
import type {LabwareData} from '../step-generation'
// TODO Ian 2018-02-19 make these shared in component library, standardize with Run App

//  ===== LABWARE ===========

// NOTE: In labware-ingred, labware objects have a `disambiguationNumber` field
// so that UI can render "96 Flat (2)"
export type Labware = {|
  ...LabwareData,
  id: string,
  disambiguationNumber: number
|}

// ==== WELLS ==========

export type Wells = {
  [wellName: string]: string // eg A1: 'A1'.
}

// export type IngredInstance = {
//   [containerId: string]: {
//     [wellName: string]: {
//       volume: number}
//   }
// }
//
// type IngredInstanceFlat = {|
//   labwareId: string,
//   groupIds: Array<string>,
//   well: string,
//   volume: number
// |}

export type WellContents = {| // non-ingredient well state, for SelectablePlate
  highlighted: boolean,
  selected: boolean,
  error: boolean,
  maxVolume: number,
  wellName: string, // eg 'A1', 'A2' etc
  groupIds: Array<string>
|}

export type AllWellContents = {
  [wellName: string]: WellContents
}

// ==== INGREDIENTS ====

export type IngredInputFields = {|
  name: ?string,
  volume: ?number,
  description: ?string,
  individualize: boolean,
  serializeName: ?string
|}

export type PersistedIngredInputFields = $Diff<IngredInputFields, {volume: any}>

// TODO IMMEDIATELY: review & consolidate these types. There are more in steplist (for substeps)
export type IngredientGroups = {
  [groupId: string]: PersistedIngredInputFields
}

export type IngredInputs = {
  name: string | null,
  volume: number | null,
  description: string | null,
  individualize: boolean,
  serializeName: string | null
}

export type IngredGroupAccessor =
  | 'name'
  | 'volume'
  | 'description'
  | 'individualize'
  | 'serializeName'

export type AllIngredGroupFields = {
  [ingredGroupId: string]: IngredInputs
}
