// @flow

// TODO Ian 2018-02-19 make these shared in component library, standardize with Run App

export type DeckSlot = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' // TODO merge with DeckSlot in `step-generation`

export type Labware = {| // TODO merge with LabwareData type in `step-generation`
  id: string,
  slot: DeckSlot,
  type: string, // eg '96-flat',
  name: string // nickname
|}

export type Wells = {
  [wellName: string]: string // eg A1: 'A1'.
}

export type IngredInputFields = {|
  name: ?string,
  volume: ?string,
  description: ?string,
  concentration: ?string,
  individualize: boolean,
  serializeName: ?string
|}

export const editableIngredFields = [
  'name',
  'serializeName',
  'volume',
  'concentration',
  'description',
  'individualize'
]
