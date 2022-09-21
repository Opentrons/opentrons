import isEqual from 'lodash/isEqual'
import { useAllHistoricOffsets } from './useAllHistoricOffsets'
import { getLabwareLocationCombos } from './getLabwareLocationCombos'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'
interface OffsetCandidate extends LabwareOffset {
  runCreatedAt: string
}
export function useOffsetCandidatesForAnalysis(analysisOutput: ProtocolAnalysisOutput, robotIp: string): OffsetCandidate[] {
  const { commands, labware } = analysisOutput
  const allHistoricOffsets = useAllHistoricOffsets({hostname: robotIp})

  if (allHistoricOffsets.length === 0) return []
  const labwareLocationCombos = getLabwareLocationCombos(commands, labware)
  console.table({labwareLocationCombos, allHistoricOffsets})

  return labwareLocationCombos.reduce<OffsetCandidate[]>(
    (acc, { location, definitionUri }) => {
      const offsetMatch = allHistoricOffsets.find(
        historicOffset =>
          !isEqual(historicOffset.vector, { x: 0, y: 0, z: 0 }) &&
          isEqual(historicOffset.location, location) &&
          historicOffset.definitionUri === definitionUri
      )

      return offsetMatch == null ? acc : [...acc, offsetMatch]
    },
    []
  )
}