import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { checkModuleCompatibility } from '@opentrons/shared-data'

import { getProtocolModulesInfo } from '../../../organisms/ProtocolSetup/utils/getProtocolModulesInfo'
import { useAttachedModules, useProtocolDetailsForRun } from '.'

import type { ProtocolModuleInfo } from '../../../organisms/ProtocolSetup/utils/getProtocolModulesInfo'
import type { AttachedModule } from '../../../redux/modules/types'

interface ModuleRenderInfoForProtocol extends ProtocolModuleInfo {
  attachedModuleMatch: AttachedModule | null
}

export function useModuleRenderInfoForProtocolById(
  robotName: string,
  runId: string
): {
  [moduleId: string]: ModuleRenderInfoForProtocol
} {
  const { protocolData } = useProtocolDetailsForRun(runId)
  const attachedModules = useAttachedModules(robotName)
  if (protocolData == null) return {}

  const protocolModulesInfo = getProtocolModulesInfo(
    protocolData,
    standardDeckDef as any
  )

  const protocolModulesInfoInLoadOrder = protocolModulesInfo.sort(
    (modA, modB) => modA.protocolLoadOrder - modB.protocolLoadOrder
  )
  let matchedAmod: AttachedModule[] = []
  const allModuleRenderInfo = protocolModulesInfoInLoadOrder.map(
    protocolMod => {
      const compatibleAttachedModule =
        attachedModules.find(
          attachedMod =>
            checkModuleCompatibility(
              attachedMod.model,
              protocolMod.moduleDef.model
            ) && !matchedAmod.find(m => m === attachedMod)
        ) ?? null
      if (compatibleAttachedModule !== null) {
        matchedAmod = [...matchedAmod, compatibleAttachedModule]
        return {
          ...protocolMod,
          attachedModuleMatch: compatibleAttachedModule,
        }
      }
      return {
        ...protocolMod,
        attachedModuleMatch: null,
      }
    }
  )

  return allModuleRenderInfo.reduce(
    (acc, moduleInfo) => ({
      ...acc,
      [moduleInfo.moduleId]: moduleInfo,
    }),
    {}
  )
}
