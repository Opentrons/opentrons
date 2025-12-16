import type { LabwareDefinition } from '@opentrons/shared-data'
import type {
  FlexStackerModuleState,
  LabwareEntities,
} from '@opentrons/step-generation'

export function getStoredLabwareDefinitions(
  storedLabwareDetails: FlexStackerModuleState['storedLabwareDetails'],
  labwareEntities: LabwareEntities
): {
  primaryLabwareDefinition: LabwareDefinition | null
  lidLabwareDefinition: LabwareDefinition | null
  adapterLabwareDefinition: LabwareDefinition | null
} | null {
  if (storedLabwareDetails == null) {
    return null
  }
  const { primaryLabwareURI, lidLabwareURI, adapterLabwareURI } =
    storedLabwareDetails
  const primaryLabwareDefinition = Object.values(labwareEntities).find(
    ({ labwareDefURI }) => labwareDefURI === primaryLabwareURI
  )?.def
  const lidLabwareDefinition = Object.values(labwareEntities).find(
    ({ labwareDefURI }) => labwareDefURI === lidLabwareURI
  )?.def
  const adapterLabwareDefinition = Object.values(labwareEntities).find(
    ({ labwareDefURI }) => labwareDefURI === adapterLabwareURI
  )?.def
  return {
    primaryLabwareDefinition: primaryLabwareDefinition ?? null,
    lidLabwareDefinition: lidLabwareDefinition ?? null,
    adapterLabwareDefinition: adapterLabwareDefinition ?? null,
  }
}
