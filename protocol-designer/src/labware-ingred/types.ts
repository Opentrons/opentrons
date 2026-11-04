import type { CutoutId, ModuleModel } from '@opentrons/shared-data'
import type {
  DeckSlot,
  Ingredient,
  WellContents,
} from '@opentrons/step-generation'

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

export type ContentsByWell = Record<string, WellContents> | null
export type WellContentsByLabware = Record<string, ContentsByWell>
export type IngredInputs = Ingredient & {
  volume?: number | null
}
export type LiquidGroupsById = Record<string, Ingredient>
export type AllIngredGroupFields = Record<string, IngredInputs>

export type Fixture =
  'stagingArea' | 'trashBin' | 'wasteChute' | 'wasteChuteAndStagingArea'

export interface ZoomedIntoSlotInfoState {
  selectedTopLabware: { labwareDefURI: string | null; amount: number }
  selectedAdapterDefURI: string | null
  selectedModuleModel: ModuleModel | null
  selectedFixture: Fixture | null
  selectedLidLabware: string | null
  selectedSlot: { slot: DeckSlot | null; cutout: CutoutId | null }
}

export interface GenerateNewProtocolState {
  isNewProtocol: boolean
}
