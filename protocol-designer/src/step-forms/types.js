// @flow

export type InitialDeckSetup = {
  labware: {[labwareId: string]: {
    type: string,
    slot: string,
  }},
  pipettes: {
    [pipetteId: string]: {
      model: string, // TODO: Ian 2018-12-17 make pipettes always name, never model. This is vestige of when pipettes had both name and model
      mount: string,
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
