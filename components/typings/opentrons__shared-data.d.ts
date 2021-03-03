// TODO(bc, 2021-03-03): remove/move this ambient declarations file for
// @opentrons/shared-data when it is rewritten in TypeScript

declare module '@opentrons/shared-data' {
  export type CoordinateTuple = [number, number, number]
  export type UnitDirection = 1 | -1
  export type UnitVectorTuple = [UnitDirection, UnitDirection, UnitDirection]

  export interface Dimensions {
    xDimension: number
    yDimension: number
    zDimension: number
  }

  // LABWARE DEF TYPES

  export type LabwareDefinition2 = Record<string, unknown> // stubbed
  export type LabwareWell = Record<string, unknown> // stubbed

  export interface WellDefinition {
    diameter?: number // NOTE: presence of diameter indicates a circular well
    depth?: number // TODO Ian 2018-03-12: depth should be required, but is missing in MALDI-plate
    height: number
    length: number
    width: number
    x: number
    y: number
    z: number
    'total-liquid-volume': number
  }

  // MODULE DEF TYPES

  export type ModuleModel = string // stubbed

  // DECK DEF TYPES

  export interface DeckSlot {
    id: string
    position: CoordinateTuple
    matingSurfaceUnitVector?: UnitVectorTuple
    boundingBox: Dimensions
    displayName: string
    compatibleModules: string[]
  }
  export interface DeckRobot {
    model: string
  }
  export interface DeckCalibrationPoint {
    id: string
    position: CoordinateTuple
    displayName: string
  }
  export interface DeckFixture {
    id: string
    slot: string
    labware: string
    displayName: string
  }
  export interface DeckLocations {
    orderedSlots: DeckSlot[]
    calibrationPoints: DeckCalibrationPoint[]
    fixtures: DeckFixture[]
  }

  export interface DeckMetadata {
    displayName: string
    tags: string[]
  }

  export interface DeckLayerFeature {
    footprint: string
  }

  export type DeckLayer = DeckLayerFeature[]

  export interface DeckDefinition {
    otId: string
    cornerOffsetFromOrigin: CoordinateTuple
    dimensions: CoordinateTuple
    robot: DeckRobot
    locations: DeckLocations
    metadata: DeckMetadata
    layers: Record<string, DeckLayer>
  }
}
