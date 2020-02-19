// @flow
import type { Mount } from '@opentrons/components'
import type {
  LabwareDefinition2,
  PipetteNameSpecs,
  ModuleType,
} from '@opentrons/shared-data'
import type { DeckSlot } from '../types'
import typeof {
  MAGDECK,
  TEMPDECK,
  THERMOCYCLER,
  TEMPERATURE_DEACTIVATED,
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_APPROACHING_TARGET,
} from '../constants'

export type FormPipette = {| pipetteName: ?string, tiprackDefURI: ?string |}
export type FormPipettesByMount = {|
  left: FormPipette,
  right: FormPipette,
|}

export type PipetteDisplayProperties = {
  [pipetteId: string]: { id: string, name: string, mount: 'left' | 'right' },
}

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
// Note: 'model' is like 'GEN1'/'GEN2' etc
export type FormModule = {| onDeck: boolean, model: string, slot: DeckSlot |}
export type FormModulesByType = {|
  tempdeck: FormModule,
  magdeck: FormModule,
  thermocycler: FormModule,
|}

export type ModuleEntity = {| id: string, type: ModuleType, model: string |}
export type ModuleEntities = { [moduleId: string]: ModuleEntity }

// NOTE: semi-redundant 'type' key in FooModuleState types is required for Flow to disambiguate 'moduleState'
export type MagneticModuleState = {| type: MAGDECK, engaged: boolean |}

export type TemperatureStatus =
  | TEMPERATURE_DEACTIVATED
  | TEMPERATURE_AT_TARGET
  | TEMPERATURE_APPROACHING_TARGET
export type TemperatureModuleState = {|
  type: TEMPDECK,
  status: TemperatureStatus,
  targetTemperature: number | null,
|}
export type ThermocyclerModuleState = {| type: THERMOCYCLER |} // TODO IL 2019-11-18 create this state

export type ModuleTemporalProperties = {|
  slot: DeckSlot,
  moduleState:
    | MagneticModuleState
    | TemperatureModuleState
    | ThermocyclerModuleState,
|}

export type ModuleOnDeck = {| ...ModuleEntity, ...ModuleTemporalProperties |}

export type ModulesForEditModulesCard = {
  [type: ModuleType]: ?ModuleOnDeck,
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
