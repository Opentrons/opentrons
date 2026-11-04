import { getActivePipetteId } from '/app/organisms/LabwarePositionCheck/LPCFlows/hooks/utils'

import { getLPCUniqValidLabwareLocationInfo } from './getLPCUniqValidLabwareLocationInfo'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
} from '@opentrons/shared-data'
import type { LabwareLocationInfo } from '/app/redux/protocol-runs'

export interface GetUniqueValidLwLocationInfoByAnalysisParams {
  protocolData: CompletedProtocolAnalysis | null
  labwareDefs: LabwareDefinition[] | null
}

export function getUniqueValidLwLocationInfoByAnalysis({
  labwareDefs,
  protocolData,
}: GetUniqueValidLwLocationInfoByAnalysisParams): LabwareLocationInfo[] {
  // If there's no pipette, there's nothing to LPC.
  const activePipetteId = getActivePipetteId(protocolData?.pipettes ?? [])

  if (protocolData == null || labwareDefs == null || activePipetteId == null) {
    return []
  } else {
    return getLPCUniqValidLabwareLocationInfo(protocolData, labwareDefs)
  }
}
