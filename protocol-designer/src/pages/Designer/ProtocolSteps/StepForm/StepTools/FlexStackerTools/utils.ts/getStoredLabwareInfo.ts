import type {
  FlexStackerModuleState,
  LabwareEntities,
} from '@opentrons/step-generation'

export const getStoredLabwareInfo = (
  stackerState: FlexStackerModuleState,
  labwareEntities: LabwareEntities
): { primaryText: string; hasLid: boolean } | null => {
  const { storedLabwareDetails } = stackerState ?? {}
  if (storedLabwareDetails == null) {
    return null
  }
  const { primaryLabwareURI, lidLabwareURI } = storedLabwareDetails
  const primaryLabwareEntity = Object.values(labwareEntities).find(
    ({ labwareDefURI }) => labwareDefURI === primaryLabwareURI
  )
  if (primaryLabwareEntity == null) {
    return null
  }
  const { displayName } = primaryLabwareEntity.def.metadata
  const hasLid = lidLabwareURI != null
  return { primaryText: displayName, hasLid }
}
