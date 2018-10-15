// @flow
import type {LabwareData} from '../step-generation'
// TODO Ian 2018-02-19 make these shared in component library, standardize with Run App

//  ===== LABWARE ===========

// NOTE: In labware-ingred, labware objects have a `disambiguationNumber` field
// so that UI can render "96 Flat (2)"
export type Labware = {|
  ...LabwareData,
  id: string,
  disambiguationNumber: number,
|}

export type LabwareTypeById = {[labwareId: string]: ?string}

// ==== WELLS ==========

export type Wells = {
  [wellName: string]: string, // eg A1: 'A1'.
}

export type WellContents = {| // non-ingredient well state, for SelectablePlate
  highlighted: boolean,
  selected: boolean,
  error: boolean,
  maxVolume: number,
  wellName: string, // eg 'A1', 'A2' etc
  groupIds: Array<string>,
|}

export type ContentsByWell = {
  [wellName: string]: WellContents,
}

export type WellContentsByLabware = {
  [labwareId: string]: ContentsByWell,
}

// ==== INGREDIENTS ====

export type OrderedLiquids = Array<{
  ingredientId: string,
  name: ?string,
}>

// TODO: Ian 2018-10-15 audit & rename these confusing types
export type LiquidGroup = {
  name: ?string,
  description: ?string,
  serialize: boolean,
}

export type IngredInputs = LiquidGroup & {
  volume: ?number,
}

export type IngredGroupAccessor = $Keys<IngredInputs>

export type LiquidGroupsById = {
  [groupId: string]: LiquidGroup,
}

export type AllIngredGroupFields = {
  [ingredGroupId: string]: IngredInputs,
}
