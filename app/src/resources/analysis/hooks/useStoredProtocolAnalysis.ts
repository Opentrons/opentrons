import { useSelector } from 'react-redux'

import { useProtocolQuery } from '@opentrons/react-api-client'

import { getStoredProtocol } from '/app/redux/protocol-storage'
import { useNotifyRunQuery } from '/app/resources/runs'
import { parseProtocolAnalysisOutput } from '/app/transformations/analysis'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { State } from '/app/redux/types'

export function useStoredProtocolAnalysis(
  runId: string | null
): ProtocolAnalysisOutput | null {
  const { data: runRecord } = useNotifyRunQuery(runId, { staleTime: Infinity })
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
