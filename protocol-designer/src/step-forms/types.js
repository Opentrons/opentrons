// @flow
import type {DeckSlot, Mount} from '@opentrons/components'

export type InitialDeckSetup = {
  labware: {[labwareId: string]: {
    type: string,
    slot: DeckSlot,
  }},
  pipettes: {
    [pipetteId: string]: {
      name: string,
      mount: Mount,
      tiprackModel: string,
    },
  },
}

// "entities" have only properties that are time-invariant

export type PipetteEntities = {
  [pipetteId: string]: {|
    name: string,
    tiprackModel: string,
  |},
}

export type LabwareEntities = {
  [labwareId: string]: {|
    type: string,
  |},
}
