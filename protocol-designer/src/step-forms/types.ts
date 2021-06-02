import type { Mount } from '@opentrons/components'
import type {
  ModuleRealType,
  ModuleModel,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import type { DeckSlot } from '../types'
import type {
  TemperatureStatus,
  ModuleEntity,
  PipetteEntity,
  LabwareEntity,
} from '@opentrons/step-generation'
export interface FormPipette {
  pipetteName: string | null | undefined
  tiprackDefURI: string | null | undefined
}
export interface FormPipettesByMount {
  left: FormPipette
  right: FormPipette
}
// =========== MODULES ========
export interface FormModule {
  onDeck: boolean
  model: ModuleModel | null
  slot: DeckSlot
}
// TODO: IL 2020-02-21 somehow use the `typeof X_MODULE_TYPE` imports here instead of writing out the strings.
// It doesn't seem possible with Flow to use these types as keys in an exact object,
// unless you write them out like this. See https://github.com/facebook/flow/issues/6492
export interface FormModulesByType {
  magneticModuleType: FormModule
  temperatureModuleType: FormModule
  thermocyclerModuleType: FormModule
}
export type ModuleEntities = Record<string, ModuleEntity>
// NOTE: semi-redundant 'type' key in FooModuleState types is required for Flow to disambiguate 'moduleState'
export interface MagneticModuleState {
  type: typeof MAGNETIC_MODULE_TYPE
  engaged: boolean
}
export interface TemperatureModuleState {
  type: typeof TEMPERATURE_MODULE_TYPE
  status: TemperatureStatus
  targetTemperature: number | null
}
export interface ThermocyclerModuleState {
  type: typeof THERMOCYCLER_MODULE_TYPE
  blockTargetTemp: number | null
  // null means block is deactivated
  lidTargetTemp: number | null
  // null means lid is deactivated
  lidOpen: boolean | null // if false, closed. If null, unknown
}
export interface ModuleTemporalProperties {
  slot: DeckSlot
  moduleState:
    | MagneticModuleState
    | TemperatureModuleState
    | ThermocyclerModuleState
}
export type ModuleOnDeck = ModuleEntity & ModuleTemporalProperties
export type ModulesForEditModulesCard = Record<
  ModuleRealType,
  ModuleOnDeck | null | undefined
>
// =========== LABWARE ========
export type NormalizedLabwareById = Record<
  string,
  {
    labwareDefURI: string
  }
>
export type NormalizedLabware = NormalizedLabwareById[keyof NormalizedLabwareById]
// =========== TEMPORAL ONLY =====
// Temporal properties (eg location) that are time-variant
export interface LabwareTemporalProperties {
  slot: DeckSlot
}
export interface PipetteTemporalProperties {
  mount: Mount
}
// =========== ON DECK ========
// The "on deck" types are entities with added properties (slot / mount)
// which may change across time (eg moving a labware to another slot)
export type LabwareOnDeck = LabwareEntity & LabwareTemporalProperties
export type PipetteOnDeck = PipetteEntity & PipetteTemporalProperties
// TODO: Ian 2019-11-08 make all values Maybe typed
export interface InitialDeckSetup {
  labware: Record<string, LabwareOnDeck>
  pipettes: Record<string, PipetteOnDeck>
  modules: Record<string, ModuleOnDeck>
}
