// @flow
export type LabwareLocations = {
  [wellName: string]: {
    x: number,
    y: number,
    z: number,

    depth: number,

    diameter?: number,

    length?: number,
    width?: number,

    'total-liquid-volume': number
  }
}
