import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'

import { getLabwareRenderInfo } from '../ProtocolRun/utils/getLabwareRenderInfo'
import { useProtocolDetailsForRun, useStoredProtocolAnalysis } from '.'

import type { LabwareRenderInfoById } from '../ProtocolRun/utils/getLabwareRenderInfo'

export function useLabwareRenderInfoForRunById(
  runId: string
): LabwareRenderInfoById {
  const { protocolData: robotProtocolAnalysis } = useProtocolDetailsForRun(
    runId
  )
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  return protocolData != null
    ? getLabwareRenderInfo(protocolData, standardDeckDef as any)
    : {}
}
