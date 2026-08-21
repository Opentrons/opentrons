import { last } from 'lodash'

import { useProtocolQuery } from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { useNotifyRunQuery } from './useNotifyRunQuery'

import type { RobotType } from '@opentrons/shared-data'

export interface QuickProtocolDetails {
  displayName: string | null
  protocolKey: string | null
  robotType: RobotType
  isQuickTransfer: boolean
  isProtocolAnalyzing: boolean
}

/**
 * Similar to useProtocolDetailsForRun, but avoids fetching the full analysis
 */
export function useQuickProtocolDetailsForRun(
  runId: string
): QuickProtocolDetails {
  const { data: runRecord } = useNotifyRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data?.protocolId ?? null

  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })

  const latestSummary = last(protocolRecord?.data.analysisSummaries)
  const isProtocolAnalyzing =
    protocolRecord != null && latestSummary?.status !== 'completed'

  const displayName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name ??
    null
  const protocolKey = protocolRecord?.data.key ?? null
  const robotType = protocolRecord?.data.robotType ?? FLEX_ROBOT_TYPE
  const isQuickTransfer = protocolRecord?.data.protocolKind === 'quick-transfer'

  return {
    displayName,
    protocolKey,
    robotType,
    isQuickTransfer,
    isProtocolAnalyzing,
  }
}
