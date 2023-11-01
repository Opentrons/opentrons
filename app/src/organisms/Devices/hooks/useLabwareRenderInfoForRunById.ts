import { getDeckDefFromRobotType } from '@opentrons/shared-data'
import { getLabwareRenderInfo } from '../ProtocolRun/utils'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useProtocolDetailsForRun, useStoredProtocolAnalysis } from '.'

import type { LabwareRenderInfoById } from '../ProtocolRun/utils/getLabwareRenderInfo'

export function useLabwareRenderInfoForRunById(
  runId: string
): LabwareRenderInfoById {
  const { robotType } = useProtocolDetailsForRun(runId)
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)

  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  const deckDef = getDeckDefFromRobotType(robotType)

  return protocolData != null ? getLabwareRenderInfo(protocolData, deckDef) : {}
}
