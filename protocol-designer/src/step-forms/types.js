// @flow

// TODO IMMEDIATELY standardize type vs model vs name for labware and pipettes >:(
export type InitialDeckSetup = {
  labware: {[labwareId: string]: {
    type: string,
    slot: string,
  }},
  pipettes: {
    [pipetteId: string]: {
      model: string,
      mount: string,
      tiprackType: string,
    },
  },
}
