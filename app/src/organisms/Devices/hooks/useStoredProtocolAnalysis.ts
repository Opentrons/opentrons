import { getStoredProtocol } from '../../../redux/protocol-storage'
import type { State } from '../../../redux/types'
import {
  parseRequiredModulesEntity,
  parseInitialLoadedLabwareEntity,
  parsePipetteEntity,
} from '@opentrons/api-client'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import { useSelector } from 'react-redux'

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

export function useStoredProtocolAnalysis(
  runId: string | null
): ProtocolAnalysisOutput | null {
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data?.protocolId ?? null

  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })

  const protocolKey = protocolRecord?.data?.key

  const storedProtocolAnalysis =
    useSelector((state: State) => getStoredProtocol(state, protocolKey))
      ?.mostRecentAnalysis ?? null

  return storedProtocolAnalysis != null
    ? parseProtocolAnalysisOutput(storedProtocolAnalysis)
    : null
}
