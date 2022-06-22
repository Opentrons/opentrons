import { hash } from '../../../redux/analytics/hash'
import { useStoredProtocolAnalysis } from './useStoredProtocolAnalysis'
import { useRunTimestamps } from '../../RunTimeControl/hooks'
import { formatInterval } from '../../RunTimeControl/utils'

import type { ProtocolAnalyticsData } from '../../../redux/analytics/types'

type GetProtocolRunAnalyticsData = () => Promise<{
  protocolRunAnalyticsData: ProtocolAnalyticsData
  runTime: string
}>

/**
 *
 * @param   {string | null} runId
 * @returns {{ getProtocolRunAnalyticsData: GetProtocolRunAnalyticsData }}
 *          Returns a promise that resolves to protocol analytics data properties
 *          for use in event trackEvent
 */
export function useProtocolRunAnalyticsData(
  runId: string | null
): {
  getProtocolRunAnalyticsData: GetProtocolRunAnalyticsData
} {
  const protocolAnalysis = useStoredProtocolAnalysis(runId)
  const { startedAt } = useRunTimestamps(runId)

  const getProtocolRunAnalyticsData: GetProtocolRunAnalyticsData = () => {
    const hashTasks = [
      hash(protocolAnalysis?.metadata?.author) ?? '',
      hash(protocolAnalysis?.metadata?.description) ?? '',
    ]

    return Promise.all(hashTasks).then(([protocolAuthor, protocolText]) => ({
      protocolRunAnalyticsData: {
        protocolType: protocolAnalysis?.config?.protocolType ?? '',
        protocolAppName:
          protocolAnalysis?.config?.protocolType === 'json'
            ? 'Protocol Designer'
            : 'Python API',
        protocolAppVersion:
          protocolAnalysis?.config?.protocolType === 'json'
            ? protocolAnalysis.config.schemaVersion.toFixed(1)
            : protocolAnalysis?.metadata?.apiLevel,
        protocolApiVersion: protocolAnalysis?.metadata?.apiLevel ?? '',
        protocolSource: protocolAnalysis?.metadata?.source ?? '',
        protocolName: protocolAnalysis?.metadata?.protocolName ?? '',
        pipettes: Object.values(protocolAnalysis?.pipettes ?? {})
          .map(pipette => pipette.name)
          .join(','),
        modules: Object.values(protocolAnalysis?.modules ?? {})
          .map(module => module.model)
          .join(','),
        protocolAuthor: protocolAuthor !== '' ? protocolAuthor : '',
        protocolText: protocolText !== '' ? protocolText : '',
      },
      runTime:
        startedAt != null ? formatInterval(startedAt, Date()) : '--:--:--',
    }))
  }

  return { getProtocolRunAnalyticsData }
}
