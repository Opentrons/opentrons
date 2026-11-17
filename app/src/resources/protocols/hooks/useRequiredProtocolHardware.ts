import last from 'lodash/last'

import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import { useRequiredProtocolHardwareFromAnalysis } from '/app/transformations/commands'

import type { ProtocolHardware } from '/app/transformations/commands'

/**
 * Returns an array of ProtocolHardware objects that are required by the given protocol ID.
 *
 * @param {string} protocolId The ID of the protocol for which required hardware is being retrieved.
 * @returns {ProtocolHardware[]} An array of ProtocolHardware objects that are required by the given protocol ID.
 */

export const useRequiredProtocolHardware = (
  protocolId: string
): { requiredProtocolHardware: ProtocolHardware[]; isLoading: boolean } => {
  const { data: protocolData } = useProtocolQuery(protocolId)
  const analysisId = last(protocolData?.data.analysisSummaries)?.id ?? null
  const { data: analysis } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    analysisId,
    { enabled: protocolData != null && analysisId != null }
  )

  return useRequiredProtocolHardwareFromAnalysis(analysis ?? null)
}
