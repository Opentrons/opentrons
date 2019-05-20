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
} from '@opentrons/shared-data'

export type LabwareWellGroupProperties = {|
  ...LabwareWellProperties,
  xOffset: number,
  yOffset: number,
  xSpacing: number,
  ySpacing: number,
|}

export type LabwareList = Array<LabwareDefinition>

export type FilterParams = {
  category: string,
  manufacturer: string,
}
