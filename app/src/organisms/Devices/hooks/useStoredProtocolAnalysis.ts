import { useSelector } from 'react-redux'
import {
  parseAllRequiredModuleModelsById,
  parseInitialLoadedLabwareEntity,
  parsePipetteEntity,
} from '@opentrons/api-client'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'

import { getStoredProtocol } from '../../../redux/protocol-storage'

import type { ModuleModelsById } from '@opentrons/api-client'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { State } from '../../../redux/types'

// TODO(bc, 2022-09-26): StoredProtocolAnalysis can be wholesale replaced by ProtocolAnalysisOutput,
// instead of just extending it, as soon as we remove the need for the schemaV6adapter
export interface StoredProtocolAnalysis
  extends Omit<ProtocolAnalysisOutput, 'modules'> {
  modules: ModuleModelsById
}

export const parseProtocolAnalysisOutput = (
  storedProtocolAnalysis: ProtocolAnalysisOutput | null
): StoredProtocolAnalysis | null => {
  const pipetteEntity = parsePipetteEntity(
    storedProtocolAnalysis?.commands ?? []
  )
  const moduleModelsById = parseAllRequiredModuleModelsById(
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
        modules: moduleModelsById,
      }
    : null
}

export function useStoredProtocolAnalysis(
  runId: string | null
): StoredProtocolAnalysis | null {
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
