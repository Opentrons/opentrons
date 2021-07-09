import { LocationLiquidState } from '@opentrons/step-generation'
// TODO Ian 2018-02-19 make these shared in component library, standardize with Run App
//  ===== LABWARE ===========
export interface DisplayLabware {
  nickname: string | null | undefined
  disambiguationNumber?: number
}
export type LabwareTypeById = Record<string, string | null | undefined>
// ==== WELLS ==========
// TODO: Ian 2019-06-08 remove this in favor of WellGroup
export type Wells = Record<string, string>
export interface WellContents {
  // eg 'A1', 'A2' etc
  wellName?: string
  groupIds: string[]
  ingreds: LocationLiquidState
  highlighted?: boolean
  selected?: boolean
  maxVolume?: number
}
export type ContentsByWell = {
  [wellName: string]: WellContents
} | null
export interface WellContentsByLabware {
  [labwareId: string]: ContentsByWell
}
// ==== INGREDIENTS ====
export type OrderedLiquids = Array<{
  ingredientId: string
  name: string | null | undefined
}>
// TODO: Ian 2018-10-15 audit & rename these confusing types
export interface LiquidGroup {
  name: string | null | undefined
  description: string | null | undefined
  serialize: boolean
}
export type IngredInputs = LiquidGroup & {
  volume?: number | null | undefined
}
export type IngredGroupAccessor = keyof IngredInputs
export type LiquidGroupsById = Record<string, LiquidGroup>
export type AllIngredGroupFields = Record<string, IngredInputs>
