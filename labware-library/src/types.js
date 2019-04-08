// @flow
import type {LabwareDefinition2 as LabwareDefinition} from '@opentrons/shared-data'

export type {
  LabwareDefinition2 as LabwareDefinition,
  LabwareParameters,
  LabwareOffset,
  LabwareWell,
  LabwareWellProperties,
  LabwareWellMap,
} from '@opentrons/shared-data'

export type LabwareList = Array<LabwareDefinition>

export type FilterParams = {
  category: string,
  manufacturer: string,
}
