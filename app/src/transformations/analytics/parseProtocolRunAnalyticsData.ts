import { EMPTY_TIMESTAMP } from '/app/resources/runs'
import { hash } from '/app/redux/analytics/hash'
import { getRobotSerialNumber } from '/app/redux/discovery'
import { formatInterval } from '/app/transformations/commands'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { StoredProtocolData } from '/app/redux/protocol-storage/types'
import type { DiscoveredRobot } from '/app/redux/discovery/types'

export const parseProtocolRunAnalyticsData = (
  protocolAnalysis: ProtocolAnalysisOutput | null,
  storedProtocol: StoredProtocolData | null,
  startedAt: string | null,
  robot: DiscoveredRobot | null
) => () => {
  const hashTasks = [
    hash(protocolAnalysis?.metadata?.author as string) ?? '',
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
