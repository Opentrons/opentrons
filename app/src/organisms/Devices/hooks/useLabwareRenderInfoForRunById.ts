import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'

import { getLabwareRenderInfo } from '../../../organisms/ProtocolSetup/utils/getLabwareRenderInfo'
import { useProtocolDetailsForRun } from '.'

import type { LabwareRenderInfoById } from '../../../organisms/ProtocolSetup/utils/getLabwareRenderInfo'

export function useLabwareRenderInfoForRunById(
  runId: string
): LabwareRenderInfoById {
  const { protocolData } = useProtocolDetailsForRun(runId)
  return protocolData != null
    ? getLabwareRenderInfo(protocolData, standardDeckDef as any)
    : {}
}
