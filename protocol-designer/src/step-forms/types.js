// @flow
import type { DeckSlot, Mount } from '@opentrons/components'
import type {
  LabwareDefinition2,
  PipetteNameSpecs,
} from '@opentrons/shared-data'

export type InitialDeckSetup = {
  labware: {
    [labwareId: string]: {
      type: string,
      slot: DeckSlot,
    },
  },
  pipettes: {
    [pipetteId: string]: {
      name: string,
      mount: Mount,
      tiprackModel: string,
    },
  },
}

export type LabwareOnDeck = $Values<$PropertyType<InitialDeckSetup, 'labware'>>
export type PipetteOnDeck = $Values<$PropertyType<InitialDeckSetup, 'pipettes'>>

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
  name: string,
  id: string,
  tiprackModel: string, // TODO: Ian 2019-04-12 change to `tiprackOtId`
  // TODO: Ian 2019-04-12 add `tiprackLabwareDef`
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
