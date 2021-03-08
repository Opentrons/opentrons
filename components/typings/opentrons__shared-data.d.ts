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

  export const SLOT_RENDER_WIDTH: 'stub' // stubbed
  export const SLOT_RENDER_HEIGHT: 'stub' // stubbed

  // LABWARE DEF TYPES

  export function wellIsRect(well: {}): any // stubbed
  export function getWellPropsForSVGLabwareV1(def: {}): any // stubbed
  export function getLabwareV1Def(type: string): any // stubbed
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
  export const GEN1: 'stub' // stubbed
  export const GEN2: 'stub' // stubbed

  export type PipetteChannels = 1 | 8

  export type PipetteDisplayCategory = typeof GEN1 | typeof GEN2
  export interface FlowRateSpec {
    value: number
    min: number
    max: number
  }
  export interface PipetteNameSpecs {
    name: string
    displayName: string
    displayCategory: PipetteDisplayCategory
    minVolume: number
    maxVolume: number
    channels: PipetteChannels
    defaultAspirateFlowRate: FlowRateSpec
    defaultDispenseFlowRate: FlowRateSpec
    defaultBlowOutFlowRate: FlowRateSpec
    defaultTipracks: string[]
    smoothieConfigs?: {
      stepsPerMM: number
      homePosition: number
      travelDistance: number
    }
  }

  export type PipetteModelSpecs = Record<string, any> // stubbed
  export function getAllPipetteNames(...a: any[]): any // stubbed
  export function getPipetteNameSpecs(s: string): any // stubbed

  // MODULE DEF TYPES

  export type ModuleModel = string // stubbed
  export function getModuleDisplayName(type: string): any // stubbed
  export const MAGNETIC_MODULE_V1: 'stub' // stubbed
  export const MAGNETIC_MODULE_V2: 'stub' // stubbed
  export const TEMPERATURE_MODULE_V1: 'stub' // stubbed
  export const TEMPERATURE_MODULE_V2: 'stub' // stubbed
  export const THERMOCYCLER_MODULE_V1: 'stub' // stubbed

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
