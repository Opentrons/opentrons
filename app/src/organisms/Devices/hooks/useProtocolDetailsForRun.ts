import * as React from 'react'
import last from 'lodash/last'
import {
  getRobotTypeFromLoadedLabware,
  schemaV6Adapter,
} from '@opentrons/shared-data'
import {
  useProtocolQuery,
  useProtocolAnalysesQuery,
  useRunQuery,
} from '@opentrons/react-api-client'

import type {
  RobotType,
  LegacySchemaAdapterOutput,
} from '@opentrons/shared-data'

export interface ProtocolDetails {
  displayName: string | null
  protocolData: LegacySchemaAdapterOutput | null
  protocolKey: string | null
  isProtocolAnalyzing?: boolean
  robotType: RobotType
}

export function useProtocolDetailsForRun(
  runId: string | null
): ProtocolDetails {
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data?.protocolId ?? null
  const [
    isPollingProtocolAnalyses,
    setIsPollingProtocolAnalyses,
  ] = React.useState<boolean>(true)

  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })

  const { data: protocolAnalyses } = useProtocolAnalysesQuery(
    protocolId,
    {
      staleTime: Infinity,
    },
    isPollingProtocolAnalyses
  )

  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null

  React.useEffect(() => {
    if (mostRecentAnalysis?.status === 'completed') {
      setIsPollingProtocolAnalyses(false)
    } else {
      setIsPollingProtocolAnalyses(true)
    }
  }, [mostRecentAnalysis?.status])

  const displayName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name

  return {
    displayName: displayName ?? null,
    protocolData:
      mostRecentAnalysis != null ? schemaV6Adapter(mostRecentAnalysis) : null,
    protocolKey: protocolRecord?.data.key ?? null,
    isProtocolAnalyzing:
      mostRecentAnalysis != null && mostRecentAnalysis?.status === 'pending',
    // this should be deleted as soon as analysis tells us intended robot type
    robotType:
      mostRecentAnalysis?.status === 'completed'
        ? getRobotTypeFromLoadedLabware(mostRecentAnalysis.labware)
        : 'OT-2 Standard',
  }
}
