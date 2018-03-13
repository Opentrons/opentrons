// @flow
import type {LabwareData} from '../step-generation'
// TODO Ian 2018-02-19 make these shared in component library, standardize with Run App

//  ===== LABWARE ===========

export type Labware = LabwareData // TODO Ian 2018-03-01 use same name, ("Labware"?)

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
  groupId: string,
  well: string,
  volume: number
|}

export type WellContents = {| // non-ingredient well state
  preselected: boolean,
  selected: boolean,
  highlighted: boolean,
  maxVolume: number,
  wellName: string, // eg 'A1', 'A2' etc
  groupId: string | null // TODO Ian 2018-03-07 this should be color, not groupId.
|}

export type AllWellContents = {
  [wellName: string]: WellContents
}

// ==== INGREDIENTS ====

export type IngredInputFields = {|
  name: ?string,
  volume: ?string,
  description: ?string,
  individualize: boolean,
  serializeName: ?string
|}

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

export type IngredGroupForLabware = {
  ...IngredInputFields,
  groupId: string,
  wells: {
    [wellName: string]: IngredInstanceFlat
  }
}

export type IngredsForLabware = {
  [groupId: string]: IngredGroupForLabware
}

export type IngredsForAllLabware = {
  [labwareId: string]: IngredsForLabware
}

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
