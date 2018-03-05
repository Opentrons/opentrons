// @flow
import type {LabwareData} from '../step-generation'
// TODO Ian 2018-02-19 make these shared in component library, standardize with Run App

//  ===== LABWARE ===========

export type Labware = LabwareData // TODO Ian 2018-03-01 use same name, ("Labware"?)

// ==== WELLS ==========

export type Wells = {
  [wellName: string]: string // eg A1: 'A1'.
}

type WellDatum = {|
  name: string,
  volume: number,
  concentration: string
|}

export type WellDetails = {|
  [wellName: string]: WellDatum
|}

type WellDetailsByLocation = {|
  [containerId: string]: WellDetails
|}

type WellJawn = {|
  wells: Wells | Array<string>, // TODO standardize what type of wells: obj or array?
  wellDetails: WellDetails,
  wellDetailsByLocation: WellDetailsByLocation | null
|}

export type WellContents = {
  preselected: boolean,
  selected: boolean,
  highlighted: boolean,
  maxVolume: number,
  wellName: string, // eg 'A1', 'A2' etc
  groupId?: string
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
  concentration: ?string,
  individualize: boolean,
  serializeName: ?string
|}

export type Ingredient = {
    ...IngredInputFields, // TODO IMMEDIATELY is this a part of it?
    ...WellJawn,
    groupId: string
}

export const editableIngredFields = [
  'name',
  'serializeName',
  'volume',
  'concentration',
  'description',
  'individualize'
]
