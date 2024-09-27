import { useSelector } from 'react-redux'

import { getStoredProtocol } from '/app/redux/protocol-storage'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useProtocolMetadata } from '/app/resources/protocols'
import { useProtocolDetailsForRun, useRunTimestamps } from '/app/resources/runs'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { ProtocolAnalyticsData } from '/app/redux/analytics/types'

import type { State } from '/app/redux/types'
import type { DiscoveredRobot } from '/app/redux/discovery/types'
import { parseProtocolRunAnalyticsData } from '/app/transformations/analytics'

type GetProtocolRunAnalyticsData = () => Promise<{
  protocolRunAnalyticsData: ProtocolAnalyticsData
  runTime: string
}>

/**
 *
 * @param   {string | null} runId
 * @returns {{ getProtocolRunAnalyticsData: GetProtocolRunAnalyticsData }}
 *          Function returned returns a promise that resolves to protocol analytics
 *          data properties for use in event trackEvent
 */
export function useProtocolRunAnalyticsData(
  runId: string | null,
  robot: DiscoveredRobot | null
): {
  getProtocolRunAnalyticsData: GetProtocolRunAnalyticsData
} {
  const robotProtocolMetadata = useProtocolMetadata()
  const { protocolData: robotProtocolAnalysis } = useProtocolDetailsForRun(
    runId
  )
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const storedProtocol = useSelector((state: State) =>
    getStoredProtocol(
      state,
      storedProtocolAnalysis?.metadata?.protocolKey as string | undefined
    )
  )
  const protocolAnalysis =
    robotProtocolAnalysis != null && robotProtocolMetadata != null
      ? {
          ...robotProtocolAnalysis,
          metadata: robotProtocolMetadata,
          config: storedProtocolAnalysis?.config,
          createdAt: storedProtocolAnalysis?.createdAt ?? '',
          errors: storedProtocolAnalysis?.errors,
          files: storedProtocolAnalysis?.files ?? [],
        }
      : storedProtocolAnalysis
  const { startedAt } = useRunTimestamps(runId)

  const getProtocolRunAnalyticsData = parseProtocolRunAnalyticsData(
    protocolAnalysis as ProtocolAnalysisOutput | null,
    storedProtocol,
    startedAt,
    robot
  )

  return { getProtocolRunAnalyticsData }
}
