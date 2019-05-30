// @flow
import type {
  LabwareDefinition2 as LabwareDefinition,
  LabwareWellShapeProperties,
  LabwareWellGroupMetadata,
  LabwareBrand,
} from '@opentrons/shared-data'

export type {
  LabwareDefinition2 as LabwareDefinition,
  LabwareParameters,
  LabwareOffset,
  LabwareWell,
  LabwareWellShapeProperties,
  LabwareWellProperties,
  LabwareWellMap,
  LabwareWellGroupMetadata,
  LabwareVolumeUnits,
  LabwareDisplayCategory,
  LabwareBrand,
} from '@opentrons/shared-data'

export type LabwareWellGroupProperties = {|
  xOffsetFromLeft: number,
  yOffsetFromTop: number,
  xSpacing: number | null,
  ySpacing: number | null,
  wellCount: number,
  shape: LabwareWellShapeProperties | null,
  depth: number | null,
  totalLiquidVolume: number | null,
  metadata: LabwareWellGroupMetadata,
  brand: LabwareBrand | null,
|}

export type LabwareList = $ReadOnlyArray<LabwareDefinition>

export type FilterParams = {
  category: string,
  manufacturer: string,
}
