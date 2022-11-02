import { getLabwareRenderInfo } from '../ProtocolRun/utils/getLabwareRenderInfo'
import { useProtocolDetailsForRun, useStoredProtocolAnalysis } from '.'

import type { LabwareRenderInfoById } from '../ProtocolRun/utils/getLabwareRenderInfo'
import {
  getDeckDefFromRobotType,
  getLoadedLabwareFromCommands,
  getRobotTypeFromLoadedLabware,
} from '@opentrons/shared-data'

export function useLabwareRenderInfoForRunById(
  runId: string
): LabwareRenderInfoById {
  const { protocolData: robotProtocolAnalysis } = useProtocolDetailsForRun(
    runId
  )
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  const loadedLabware = getLoadedLabwareFromCommands(
    protocolData?.commands ?? []
  )
  const robotType = getRobotTypeFromLoadedLabware(loadedLabware)

  const deckDef = getDeckDefFromRobotType(robotType)

  return protocolData != null ? getLabwareRenderInfo(protocolData, deckDef) : {}
}
