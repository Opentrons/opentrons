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

export type IngredInstance = {
  [containerId: string]: {
    [wellName: string]: {
      volume: number}
  }
}

type IngredInstanceFlat = {|
  labwareId: string,
  groupIds: Array<string>,
  well: string,
  volume: number
|}

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

export type IngredGroupForLabware = {
  ...IngredInputFields,
  groupId: string,
  wells: {
    [wellName: string]: IngredInstanceFlat
  }
}

export type IngredientGroup = {|
  groupId: string,
  name: string,
  volume: number, // TODO Ian 2018-03-07 this is the 'default' volume, only used to determine exact clone for EDIT_INGREDIENT. Revisit this.
  description: string,
  individualize: boolean,
  serializeName: string,
  instances: {
    [labwareId: string]: {
      [wellName: string]: IngredInstanceFlat
    }
  }
|}

export type AllIngredGroups = {
  [groupId: string]: IngredientGroup
}

// TODO IMMEDIATELY: Remove
//
// export type IngredsForLabware = {
//   [groupId: string]: IngredGroupForLabware
// }
//
// export type IngredsForAllLabware = {
//   [labwareId: string]: IngredsForLabware
// }

export const editableIngredFields = [
  'name',
  'serializeName',
  // 'volume',
  'description',
  'individualize'
]

export const persistedIngredFields = [
  'name',
  'serializeName',
  'description',
  'individualize'
]

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
