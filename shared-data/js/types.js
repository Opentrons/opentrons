// @flow
export type WellDefinition = {
  diameter?: number, // NOTE: presence of diameter indicates a circular well
  depth?: number, // TODO Ian 2018-03-12: depth should be required, but is missing in MALDI-plate
  height: number,
  length: number,
  width: number,
  x: number,
  y: number,
  z: number,
  'total-liquid-volume': number,
}

// NOTE: must be continually synced with JSON Schema in schema.js
export type LabwareDefinition = {
  metadata: {
    name: string,
    format: string,

    deprecated?: boolean,
    displayName?: string,
    displayCategory?: string,
    isValidSource?: boolean,
    isTiprack?: boolean,
    tipVolume?: number,
  },
  ordering: Array<Array<string>>,
  wells: {
    [well: string]: WellDefinition,
  },
}

export type AllLabwareDefinitions = {
  [name: string]: LabwareDefinition,
}
