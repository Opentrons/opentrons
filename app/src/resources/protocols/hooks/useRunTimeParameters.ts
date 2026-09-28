import last from 'lodash/last'

import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import type { RunTimeParameter } from '@opentrons/shared-data'

/**
 * Returns an array of RunTimeParameters objects that are optional by the given protocol ID.
 *
 * @param {string} protocolId The ID of the protocol for which required hardware is being retrieved.
 * @returns {RunTimeParameters[]} An array of RunTimeParameters objects that are required by the given protocol ID.
 */

export const useRunTimeParameters = (
  protocolId: string
): RunTimeParameter[] => {
  const { data: protocolData } = useProtocolQuery(protocolId)
  const analysisId = last(protocolData?.data.analysisSummaries)?.id ?? null
  const { data: analysis } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    analysisId,
    { enabled: protocolData != null && analysisId != null }
  )

  return analysis?.runTimeParameters ?? []
}
