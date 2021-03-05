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

  export const SLOT_RENDER_WIDTH = 'stub' // stubbed
  export const SLOT_RENDER_HEIGHT = 'stub' // stubbed

  // LABWARE DEF TYPES

  export type wellIsRect = () => any // stubbed
  export type getWellPropsForSVGLabwareV1 = () => any // stubbed
  export type getLabwareV1Def = () => any // stubbed
  export type LabwareDefinition1 = Record<string, any> // stubbed
  export type LabwareDefinition2 = Record<string, any> // stubbed
  export type LabwareWell = Record<string, any> // stubbed

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

  // PIPETTE DEF TYPES

  export type PipetteNameSpecs = Record<string, any> // stubbed
  export type PipetteModelSpecs = Record<string, any> // stubbed
  export type getAllPipetteNames = () => any // stubbed
  export type getPipetteNameSpecs = () => any // stubbed
  export const GEN1 = 'stub' // stubbed
  export const GEN2 = 'stub' // stubbed

  // MODULE DEF TYPES

  export const ModuleModel = 'stub' // stubbed
  export type getModuleDisplayName = () => any // stubbed
  export const MAGNETIC_MODULE_V1 = 'stub' // stubbed
  export const MAGNETIC_MODULE_V2 = 'stub' // stubbed
  export const TEMPERATURE_MODULE_V1 = 'stub' // stubbed
  export const TEMPERATURE_MODULE_V2 = 'stub' // stubbed
  export const THERMOCYCLER_MODULE_V1 = 'stub' // stubbed

  // DECK DEF TYPES

  export type DeckSlotId = string

  export interface DeckSlot {
    id: DeckSlotId
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
