import last from 'lodash/last'
import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import { getLabwareSetupItemGroups } from '/app/transformations/commands'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { LabwareSetupItem } from '/app/transformations/commands'
/**
 * Returns an array of LabwareSetupItem objects that are required by the given protocol ID.
 *
 * @param {string} protocolId The ID of the protocol for which required labware setup items are being retrieved.
 * @returns {LabwareSetupItem[]} An array of LabwareSetupItem objects that are required by the given protocol ID.
 */
export const useRequiredProtocolLabware = (
  protocolId: string
): LabwareSetupItem[] => {
  const { data: protocolData } = useProtocolQuery(protocolId)
  const {
    data: mostRecentAnalysis,
  } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolData?.data.analysisSummaries)?.id ?? null,
    { enabled: protocolData != null }
  )
  const commands =
    (mostRecentAnalysis as CompletedProtocolAnalysis)?.commands ?? []
  const { onDeckItems, offDeckItems } = getLabwareSetupItemGroups(commands)
  return [...onDeckItems, ...offDeckItems]
}
