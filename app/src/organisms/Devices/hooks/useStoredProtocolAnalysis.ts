import { useSelector } from 'react-redux'
import {
  parseAllRequiredModuleModelsById,
  parseInitialLoadedLabwareEntity,
  parsePipetteEntity,
} from '@opentrons/api-client'
import {
  schemaV6Adapter,
  getLoadedLabwareDefinitionsByUri,
} from '@opentrons/shared-data'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'

import { getStoredProtocol } from '../../../redux/protocol-storage'

import type {
  LoadedLabwareEntity,
  ModuleModelsById,
  PipetteNamesById,
} from '@opentrons/api-client'
import type {
  ProtocolAnalysisOutput,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { State } from '../../../redux/types'

// TODO(bc, 2022-09-26): StoredProtocolAnalysis can be wholesale replaced by ProtocolAnalysisOutput,
// instead of just extending it, as soon as we remove the need for the schemaV6adapter
export interface StoredProtocolAnalysis
  extends Omit<ProtocolAnalysisOutput, 'pipettes' | 'modules' | 'labware'> {
  pipettes: PipetteNamesById[]
  modules: ModuleModelsById
  labware: LoadedLabwareEntity[]
  labwareDefinitions: { [defUri: string]: LabwareDefinition2 }
}

export const parseProtocolAnalysisOutput = (
  storedProtocolAnalysis: ProtocolAnalysisOutput | null
): StoredProtocolAnalysis | null => {
  const pipettesNamesById = parsePipetteEntity(
    storedProtocolAnalysis?.commands ?? []
  )
  const moduleModelsById = parseAllRequiredModuleModelsById(
    storedProtocolAnalysis?.commands ?? []
  )
  const labwareById = parseInitialLoadedLabwareEntity(
    storedProtocolAnalysis?.commands ?? []
  )
  const labwareDefinitionsByUri = getLoadedLabwareDefinitionsByUri(
    storedProtocolAnalysis?.commands ?? []
  )
  return storedProtocolAnalysis != null
    ? {
        ...storedProtocolAnalysis,
        pipettes: pipettesNamesById,
        modules: moduleModelsById,
        labware: labwareById,
        labwareDefinitions: labwareDefinitionsByUri,
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

  return storedProtocolAnalysis != null && 'modules' in storedProtocolAnalysis
    ? schemaV6Adapter(storedProtocolAnalysis)
    : parseProtocolAnalysisOutput(storedProtocolAnalysis)
}
