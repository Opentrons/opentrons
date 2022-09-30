import * as React from 'react'
import last from 'lodash/last'
import {
  useProtocolAnalysesQuery,
  useRunQuery,
} from '@opentrons/react-api-client'

import { getLabwarePositionCheckSteps } from '../getLabwarePositionCheckSteps'
import type { LabwarePositionCheckStep } from '../types'

export function useDeprecatedSteps(runId: string | null): LabwarePositionCheckStep[] {
  const [LPCSteps, setLPCSteps] = React.useState<LabwarePositionCheckStep[]>([])

  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data?.protocolId ?? null

  const { data: protocolAnalyses } = useProtocolAnalysesQuery(
    protocolId,
    { staleTime: Infinity }
  )

  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null

  if (mostRecentAnalysis == null) return [] // this state should never be reached
  if (LPCSteps.length === 0) {
    setLPCSteps(getLabwarePositionCheckSteps(mostRecentAnalysis))
  }
  return LPCSteps
}
