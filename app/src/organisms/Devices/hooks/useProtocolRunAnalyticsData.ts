import { useSelector } from 'react-redux'

import { hash } from '../../../redux/analytics/hash'
import { getStoredProtocol } from '../../../redux/protocol-storage'
import { getRobotSerialNumber } from '../../../redux/discovery'
import { useStoredProtocolAnalysis, useProtocolDetailsForRun } from './'
import { useProtocolMetadata } from './useProtocolMetadata'
import { useRunTimestamps } from '../../RunTimeControl/hooks'
import { formatInterval } from '../../RunTimeControl/utils'
import { EMPTY_TIMESTAMP } from '../constants'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { ProtocolAnalyticsData } from '../../../redux/analytics/types'
import type { StoredProtocolData } from '../../../redux/protocol-storage/types'
import type { State } from '../../../redux/types'
import type { DiscoveredRobot } from '../../../redux/discovery/types'

export const parseProtocolRunAnalyticsData = (
  protocolAnalysis: ProtocolAnalysisOutput | null,
  storedProtocol: StoredProtocolData | null,
  startedAt: string | null,
  robot: DiscoveredRobot | null
) => () => {
  const hashTasks = [
    hash(protocolAnalysis?.metadata?.author) ?? '',
    hash(storedProtocol?.srcFiles?.toString() ?? '') ?? '',
  ]

  const serialNumber =
    robot?.status != null ? getRobotSerialNumber(robot) : null

  return Promise.all(hashTasks).then(([protocolAuthor, protocolText]) => ({
    protocolRunAnalyticsData: {
      protocolType: protocolAnalysis?.config?.protocolType ?? '',
      protocolAppName:
        protocolAnalysis?.config?.protocolType === 'json'
          ? 'Protocol Designer'
          : 'Python API',
      protocolAppVersion:
        protocolAnalysis?.config?.protocolType === 'json'
          ? protocolAnalysis?.config?.schemaVersion.toFixed(1)
          : protocolAnalysis?.metadata?.apiLevel,
      protocolApiVersion: protocolAnalysis?.metadata?.apiLevel ?? '',
      protocolSource: protocolAnalysis?.metadata?.source ?? '',
      protocolName: protocolAnalysis?.metadata?.protocolName ?? '',
      pipettes: Object.values(protocolAnalysis?.pipettes ?? {})
        .map(pipette => pipette.pipetteName)
        .join(','),
      modules: Object.values(protocolAnalysis?.modules ?? {})
        .map(module => module.model)
        .join(','),
      protocolAuthor: protocolAuthor !== '' ? protocolAuthor : '',
      protocolText: protocolText !== '' ? protocolText : '',
      protocolHasRunTimeParameters:
        protocolAnalysis?.runTimeParameters != null
          ? protocolAnalysis?.runTimeParameters?.length > 0
          : false,
      protocolHasRunTimeParameterCustomValues:
        protocolAnalysis?.runTimeParameters?.some(param =>
          param.type === 'csv_file' ? true : param.value !== param.default
        ) ?? false,
      robotType:
        protocolAnalysis?.robotType != null
          ? protocolAnalysis?.robotType
          : storedProtocol?.mostRecentAnalysis?.robotType,
      robotSerialNumber: serialNumber ?? '',
    },
    runTime:
      startedAt != null ? formatInterval(startedAt, Date()) : EMPTY_TIMESTAMP,
  }))
}

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
    getStoredProtocol(state, storedProtocolAnalysis?.metadata?.protocolKey)
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
