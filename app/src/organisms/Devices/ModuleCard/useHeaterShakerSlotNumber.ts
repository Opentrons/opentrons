import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { getProtocolModulesInfo } from '../../ProtocolSetup/utils/getProtocolModulesInfo'
import { useProtocolDetails } from '../../RunDetails/hooks'

interface HeaterShakerSlotNumber {
  slotNumber?: string
}

export function useHeaterShakerSlotNumber(): HeaterShakerSlotNumber {
  const { protocolData } = useProtocolDetails()
  if (protocolData == null) return {}
  const protocolModulesInfo = getProtocolModulesInfo(
    protocolData,
    standardDeckDef as any
  )
  const slotNumber = protocolModulesInfo.find(
    module => module.moduleDef.model === 'heaterShakerModuleV1'
  )?.slotName

  return { slotNumber }
}
