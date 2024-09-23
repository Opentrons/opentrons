import {
  parseRequiredModulesEntity,
  parseInitialLoadedLabwareEntity,
  parsePipetteEntity,
} from '@opentrons/shared-data'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

export const parseProtocolAnalysisOutput = (
  storedProtocolAnalysis: ProtocolAnalysisOutput | null
): ProtocolAnalysisOutput | null => {
  const pipetteEntity = parsePipetteEntity(
    storedProtocolAnalysis?.commands ?? []
  )
  const moduleEntity = parseRequiredModulesEntity(
    storedProtocolAnalysis?.commands ?? []
  )
  const labwareEntity = parseInitialLoadedLabwareEntity(
    storedProtocolAnalysis?.commands ?? []
  )
  return storedProtocolAnalysis != null
    ? {
        ...storedProtocolAnalysis,
        pipettes: storedProtocolAnalysis.pipettes ?? pipetteEntity,
        labware: storedProtocolAnalysis.labware ?? labwareEntity,
        modules: storedProtocolAnalysis.modules ?? moduleEntity,
      }
    : null
}
