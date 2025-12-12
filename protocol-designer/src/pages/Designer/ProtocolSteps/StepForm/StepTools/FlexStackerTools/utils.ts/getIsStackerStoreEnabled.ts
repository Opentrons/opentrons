import { FLEX_STACKER_MODULE_V1, getMaxPoolCount } from '@opentrons/shared-data'

import type {
  FlexStackerModuleState,
  LabwareEntities,
} from '@opentrons/step-generation'

const SHUTTLE_IDS_MAPPED_TO_HOPPER_URIS: Record<
  keyof FlexStackerModuleState['labwareOnShuttle'],
  keyof FlexStackerModuleState['storedLabwareDetails']
> = {
  primaryLabwareId: 'primaryLabwareURI',
  adapterLabwareId: 'adapterLabwareURI',
  lidLabwareId: 'lidLabwareURI',
}

export const getIsStackerStoreEnabled = (
  stackerState: FlexStackerModuleState,
  labwareEntities: LabwareEntities
): boolean => {
  const { labwareOnShuttle, storedLabwareDetails, labwareInHopper } =
    stackerState ?? {}
  if (labwareOnShuttle == null) {
    return false
  }
  if (storedLabwareDetails == null) {
    return true
  }
  // labware is present on shuttle and stored labware details are non-null
  const isValid = Object.entries(labwareOnShuttle).every(
    ([shuttleField, shuttleLabwareId]) => {
      const configuredURI =
        SHUTTLE_IDS_MAPPED_TO_HOPPER_URIS[
          shuttleField as keyof typeof SHUTTLE_IDS_MAPPED_TO_HOPPER_URIS
        ]
      const shuttleEntityURI =
        labwareEntities[shuttleLabwareId]?.labwareDefURI ?? null
      return shuttleEntityURI === configuredURI
    }
  )
  const maxPoolCount =
    storedLabwareDetails.primaryLabwareURI != null
      ? getMaxPoolCount({
          labwareDefinitions: {
            primary:
              labwareEntities[storedLabwareDetails.primaryLabwareURI]?.def,
            adapter:
              labwareEntities[storedLabwareDetails.adapterLabwareURI ?? '']
                ?.def,
            lid: labwareEntities[storedLabwareDetails.lidLabwareURI ?? '']?.def,
          },
          model: FLEX_STACKER_MODULE_V1,
        })
      : 0
  const isFull =
    labwareInHopper != null && labwareInHopper.length >= maxPoolCount

  return isValid && !isFull
}
