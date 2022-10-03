import * as React from 'react'
import last from 'lodash/last'
import {
  useProtocolAnalysesQuery,
  useRunQuery,
} from '@opentrons/react-api-client'

import { getLabwarePositionCheckSteps } from '../getLabwarePositionCheckSteps'
import type { LabwarePositionCheckStep } from '../types'

export function useSteps(runId: string | null): LabwarePositionCheckStep[] {
  const [LPCSteps, setLPCSteps] = React.useState<LabwarePositionCheckStep[]>([])
  const { data: runRecord } = {data: {data: {protocolId: '234'}}}//useRunQuery(runId, { staleTime: Infinity })
  console.log('runRecord', runRecord)
  const protocolId = runRecord?.data?.protocolId ?? null
  console.log('protocolId', protocolId)

  const { data: protocolAnalyses } ={data:[] }
  // useProtocolAnalysesQuery(
  //   protocolId,
  //   { staleTime: Infinity }
  // )
  console.log('protocolAnalyses', protocolAnalyses)

  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null

  console.log('mostRecentAnalysis', mostRecentAnalysis)
  if (mostRecentAnalysis == null) return [] // this state should never be reached

  if (LPCSteps.length === 0) {
    setLPCSteps(getLabwarePositionCheckSteps(mostRecentAnalysis))
  }
  console.log('LPCSteps', LPCSteps)
  return LPCSteps 
}
