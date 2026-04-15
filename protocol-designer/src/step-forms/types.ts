import type { Mount } from '@opentrons/components'
import type {
  CutoutId,
  FlexModuleCutoutFixtureId,
  LoadedLabwareLocation,
  ModuleModel,
  ModuleType,
  NozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type {
  AdditionalEquipmentEntity,
  LabwareEntity,
  ModuleEntity,
  ModuleTemporalProperties,
  PipetteEntity,
  TOUCHED_PIPETTABLE_LABWARE,
} from '@opentrons/step-generation'
import type { DeckSlot } from '../types'

export interface FormPipette {
  pipetteName?: string | null
  tiprackDefURI?: string[] | null
}
export interface FormPipettesByMount {
  left: FormPipette
  right: FormPipette
}
// =========== MODULES ========
export interface FormModule {
  model: ModuleModel
  type: ModuleType
  slot: DeckSlot
  cutoutFixtureId: FlexModuleCutoutFixtureId | null
  cutoutId: CutoutId | null
}
export type FormModules = Record<number, FormModule>
export type ModuleEntities = Record<string, ModuleEntity>
// NOTE: semi-redundant 'type' key in FooModuleState types is required for Flow to disambiguate 'moduleState'

export type ModuleOnDeck = ModuleEntity & ModuleTemporalProperties
export type ModulesForEditModulesCard = Partial<
  Record<ModuleType, ModuleOnDeck[] | null | undefined>
>
// =========== LABWARE ========
export type NormalizedLabwareById = Record<
  string,
  {
    labwareDefURI: string
    pythonName: string
    displayCategory: string
  }
>
export type NormalizedLabware =
  NormalizedLabwareById[keyof NormalizedLabwareById]
// =========== TEMPORAL ONLY =====
// Temporal properties (eg location) that are time-variant
export interface LabwareTemporalProperties {
  stack: string[] // a stack of ids from top to bottom
  // The single entity this labware is stacked on (labware, module, slot, hopper, etc.).
  stackedOnNode?: LoadedLabwareLocation
  // The single labware ID this labware contains when that applies.
  contains?: string
  // we currently use this property only to track if a lid has been placed on a "pipettable" labware that could presumably contain liquid
  // we can expand this type in the future to track other types of sterility for various labware types
  sterility?: typeof TOUCHED_PIPETTABLE_LABWARE
}
export interface PipetteTemporalProperties {
  mount: Mount
  nozzles?: NozzleConfigurationStyle
  prevNozzles?: NozzleConfigurationStyle
}
// =========== ON DECK ========
// The "on deck" types are entities with added properties (slot / mount)
// which may change across time (eg moving a labware to another slot)
export type LabwareOnDeck = LabwareEntity & LabwareTemporalProperties
export type PipetteOnDeck = PipetteEntity & PipetteTemporalProperties
export type AdditionalEquipmentOnDeck = AdditionalEquipmentEntity
// TODO: Ian 2019-11-08 make all values Maybe typed

export type InitialDeckSetup = AllTemporalPropertiesForTimelineFrame

export interface AllTemporalPropertiesForTimelineFrame {
  labware: {
    [labwareId: string]: LabwareOnDeck
  }
  pipettes: {
    [pipetteId: string]: PipetteOnDeck
  }
  modules: {
    [moduleId: string]: ModuleOnDeck
  }
  additionalEquipmentOnDeck: {
    [additionalEquipmentId: string]: AdditionalEquipmentOnDeck
  }
}
