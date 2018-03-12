// @flow
export type LabwareDefinition = {
  metadata: {
    name: string
  },
  ordering: Array<Array<string>>,
  wells: {
    [well: string]: {
      diameter?: number, // NOTE: presence of diameter indicates a circular well
      depth?: number, // TODO Ian 2018-03-12: depth should be required, but is missing in MALDI-plate
      height: number,
      length: number,
      width: number,
      x: number,
      y: number,
      z: number
    }
  }
}

export type AllLabwareDefinitions = {
  [name: string]: LabwareDefinition
}
