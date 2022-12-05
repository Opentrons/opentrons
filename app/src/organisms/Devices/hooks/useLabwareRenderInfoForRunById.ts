import { getDeckDefFromRobotType } from '@opentrons/shared-data'
import { getLabwareRenderInfo } from '../ProtocolRun/utils/getLabwareRenderInfo'
import { useProtocolDetailsForRun, useStoredProtocolAnalysis } from '.'

import type { LabwareRenderInfoById } from '../ProtocolRun/utils/getLabwareRenderInfo'

export function useLabwareRenderInfoForRunById(
  runId: string
): LabwareRenderInfoById {
  const {
    protocolData: robotProtocolAnalysis,
    robotType,
  } = useProtocolDetailsForRun(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  const deckDef = getDeckDefFromRobotType(robotType)

  return protocolData != null ? getLabwareRenderInfo(protocolData, deckDef) : {}
}
