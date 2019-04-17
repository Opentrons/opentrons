// @flow
import type { DeckSlot, Mount } from '@opentrons/components'
import type {
  LabwareDefinition2,
  PipetteNameSpecs,
} from '@opentrons/shared-data'

export type FormPipette = { pipetteName: ?string, tiprackModel: ?string }
export type FormPipettesByMount = {
  left: FormPipette,
  right: FormPipette,
}

// "entities" have only properties that are time-invariant
// when they are de-normalized, the definitions they reference are baked in
// =========== PIPETTES ========

export type NormalizedPipetteById = {
  [pipetteId: string]: {|
    name: string,
    id: string,
    tiprackModel: string, // TODO: Ian 2019-04-12 change to `tiprackOtId`
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

// =========== LABWARE ========

export type NormalizedLabwareById = {
  [labwareId: string]: {|
    type: string, // TODO: Ian 2019-04-12 change to `definitionOtId`
  |},
}

export type NormalizedLabware = $Values<NormalizedLabwareById>

export type LabwareEntity = {|
  id: string,
  type: string, // TODO: Ian 2019-04-12 change to `definitionOtId`
  def: LabwareDefinition2,
|}
export type LabwareEntities = {
  [labwareId: string]: LabwareEntity,
}

// =========== TEMPORAL ONLY =====
// Temporal properties (eg location) that are time-variant

export type TemporalLabware = {|
  slot: DeckSlot,
|}

export type TemporalPipette = {|
  mount: Mount,
|}

// =========== ON DECK ========

// The "on deck" types are entities with added properties (slot / mount)
// which may change across time (eg moving a labware to another slot)

export type LabwareOnDeck = {|
  ...LabwareEntity,
  ...TemporalLabware,
|}

export type PipetteOnDeck = {|
  ...PipetteEntity,
  ...TemporalPipette,
|}

export type InitialDeckSetup = {
  labware: {
    [labwareId: string]: LabwareOnDeck,
  },
  pipettes: {
    [pipetteId: string]: PipetteOnDeck,
  },
}
