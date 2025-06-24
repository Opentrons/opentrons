import type {
  LabwareBrand,
  LabwareDefinition,
  LabwareWellGroupMetadata,
  LabwareWellShapeProperties,
  LoadedLabware,
} from '@opentrons/shared-data'

export interface LabwareDefAndDate {
  definition: LabwareDefinition
  modified?: number
  filename?: string
}

export type LabwareFilter =
  | 'all'
  | 'wellPlate'
  | 'tipRack'
  | 'tubeRack'
  | 'reservoir'
  | 'aluminumBlock'
  | 'customLabware'
  | 'adapter'
  | 'lid'

export type LabwareSort = 'alphabetical' | 'reverse'

export interface LabwareWellGroupProperties {
  xOffsetFromLeft: number
  yOffsetFromBack: number
  xSpacing: number | null
  ySpacing: number | null
  wellCount: number
  shape: LabwareWellShapeProperties | null
  depth: number | null
  totalLiquidVolume: number | null
  metadata: LabwareWellGroupMetadata
  brand: LabwareBrand | null
}

export type LoadedLabwares = LoadedLabware[] | Record<string, LoadedLabware>
