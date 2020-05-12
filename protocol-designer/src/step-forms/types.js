// @flow
import type { Mount } from '@opentrons/components'
import type {
  LabwareDefinition2,
  PipetteNameSpecs,
  ModuleRealType,
  ModuleModel,
} from '@opentrons/shared-data'
import type { DeckSlot } from '../types'
import typeof {
  TEMPERATURE_DEACTIVATED,
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_APPROACHING_TARGET,
} from '../constants'
import typeof {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

export type FormPipette = {| pipetteName: ?string, tiprackDefURI: ?string |}
export type FormPipettesByMount = {|
  left: FormPipette,
  right: FormPipette,
|}

// "entities" have only properties that are time-invariant
// when they are de-normalized, the definitions they reference are baked in
// =========== PIPETTES ========

export type NormalizedPipetteById = {
  [pipetteId: string]: {|
    name: string,
    id: string,
    tiprackDefURI: string,
  |},
}
export type NormalizedPipette = $Values<NormalizedPipetteById>

export type PipetteEntity = {|
  ...NormalizedPipette,
  tiprackLabwareDef: LabwareDefinition2,
  spec: PipetteNameSpecs,
|}

export type PipetteEntities = {
  [pipetteId: string]: PipetteEntity,
}

// =========== MODULES ========
export type FormModule = {|
  onDeck: boolean,
  model: ModuleModel | null,
  slot: DeckSlot,
|}

// TODO: IL 2020-02-21 somehow use the `typeof X_MODULE_TYPE` imports here instead of writing out the strings.
// It doesn't seem possible with Flow to use these types as keys in an exact object,
// unless you write them out like this. See https://github.com/facebook/flow/issues/6492
export type FormModulesByType = {|
  magneticModuleType: FormModule,
  temperatureModuleType: FormModule,
  thermocyclerModuleType: FormModule,
|}

export type ModuleEntity = {|
  id: string,
  type: ModuleRealType,
  model: ModuleModel,
|}
export type ModuleEntities = { [moduleId: string]: ModuleEntity }

// NOTE: semi-redundant 'type' key in FooModuleState types is required for Flow to disambiguate 'moduleState'
export type MagneticModuleState = {|
  type: MAGNETIC_MODULE_TYPE,
  engaged: boolean,
|}

export type TemperatureStatus =
  | TEMPERATURE_DEACTIVATED
  | TEMPERATURE_AT_TARGET
  | TEMPERATURE_APPROACHING_TARGET
export type TemperatureModuleState = {|
  type: TEMPERATURE_MODULE_TYPE,
  status: TemperatureStatus,
  targetTemperature: number | null,
|}
export type ThermocyclerModuleState = {|
  type: THERMOCYCLER_MODULE_TYPE,
  blockTargetTemp: number | null, // null means block is deactivated
  lidTargetTemp: number | null, // null means lid is deactivated
  lidOpen: boolean | null, // if false, closed. If null, unknown
|}

export type ModuleTemporalProperties = {|
  slot: DeckSlot,
  moduleState:
    | MagneticModuleState
    | TemperatureModuleState
    | ThermocyclerModuleState,
|}

export type ModuleOnDeck = {| ...ModuleEntity, ...ModuleTemporalProperties |}

export type ModulesForEditModulesCard = {
  [type: ModuleRealType]: ?ModuleOnDeck,
}

// =========== LABWARE ========

export type NormalizedLabwareById = {
  [labwareId: string]: {|
    labwareDefURI: string,
  |},
}

export type NormalizedLabware = $Values<NormalizedLabwareById>

export type LabwareEntity = {|
  id: string,
  labwareDefURI: string,
  def: LabwareDefinition2,
|}
export type LabwareEntities = {
  [labwareId: string]: LabwareEntity,
}

// =========== TEMPORAL ONLY =====
// Temporal properties (eg location) that are time-variant

export type LabwareTemporalProperties = {|
  slot: DeckSlot,
|}

export type PipetteTemporalProperties = {|
  mount: Mount,
|}

// =========== ON DECK ========

// The "on deck" types are entities with added properties (slot / mount)
// which may change across time (eg moving a labware to another slot)

export type LabwareOnDeck = {|
  ...LabwareEntity,
  ...LabwareTemporalProperties,
|}

export type PipetteOnDeck = {|
  ...PipetteEntity,
  ...PipetteTemporalProperties,
|}

// TODO: Ian 2019-11-08 make all values Maybe typed
export type InitialDeckSetup = {
  labware: {
    [labwareId: string]: LabwareOnDeck,
  },
  pipettes: {
    [pipetteId: string]: PipetteOnDeck,
  },
  modules: {
    [moduleId: string]: ModuleOnDeck,
  },
}
