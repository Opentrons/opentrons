// @flow
import type {
  LabwareDefinition2 as LabwareDefinition,
  LabwareWellProperties,
} from '@opentrons/shared-data'

export type {
  LabwareDefinition2 as LabwareDefinition,
  LabwareParameters,
  LabwareOffset,
  LabwareWell,
  LabwareWellProperties,
  LabwareWellMap,
  LabwareVolumeUnits,
  LabwareDisplayCategory,
  LabwareBrand,
} from '@opentrons/shared-data'

export type LabwareWellGroupProperties = {|
  ...LabwareWellProperties,
  xStart: number,
  yStart: number,
  xOffsetFromLeft: number,
  yOffsetFromTop: number,
  xSpacing: number,
  ySpacing: number,
  wellCount: number,
|}

export type LabwareList = Array<LabwareDefinition>

export type FilterParams = {
  category: string,
  manufacturer: string,
}
