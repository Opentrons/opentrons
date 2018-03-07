// @flow
import type {LabwareData} from '../step-generation'
// TODO Ian 2018-02-19 make these shared in component library, standardize with Run App

//  ===== LABWARE ===========

export type Labware = LabwareData // TODO Ian 2018-03-01 use same name, ("Labware"?)

// ==== WELLS ==========

export type Wells = {
  [wellName: string]: string // eg A1: 'A1'.
}

type IngredInstance = {|
  labwareId: string,
  groupId: string,
  well: string,
  volume: number
|}

export type WellContents = { // non-ingredient well state
  preselected: boolean,
  selected: boolean,
  highlighted: boolean,
  maxVolume: number,
  wellName: string, // eg 'A1', 'A2' etc
  groupId?: string // TODO Ian 2018-03-07 this should be color, not groupId.
}

export type AllWellContents = {
  [wellName: string]: WellContents
}

export type WellMatrices = {[containerId: string]: Array<Array<string>>}

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
  name?: string,
  volume?: number, // TODO Ian 2018-03-07 this is the 'default' volume, only used to determine exact clone for EDIT_INGREDIENT. Revisit this.
  description?: string,
  serializeName?: string,
  individualize?: boolean,
  instances: {
    [labwareId: string]: {
      [wellName: string]: IngredInstance
    }
  }
|}

export type AllIngredGroups = {
  [groupId: string]: IngredientGroup
}

export type IngredGroupForLabware = {
  ...IngredientGroup,
  wells: {
    [wellName: string]: IngredInstance
  }
}

// Like AllIngredGroups, but no labwareId key. Here, labwareId has already been given
export type IngredsForLabware = {
  [groupId: string]: IngredGroupForLabware
}

export const singleWellFields = [
  'highlighted',
  'preselected',
  'selected',
  'wellName',
  'maxVolume',
  'groupId'
]

export const editableIngredFields = [
  'name',
  'serializeName',
  'volume',
  'description',
  'individualize'
]

export const persistedIngredFields = [
  'name',
  'serializeName',
  'description',
  'individualize'
]
