import {
  checkModuleCompatibility,
  getDeckDefFromRobotType,
  getLoadedLabwareFromCommands,
  getRobotTypeFromLoadedLabware,
} from '@opentrons/shared-data'

import { getProtocolModulesInfo } from '../ProtocolRun/utils/getProtocolModulesInfo'
import {
  useAttachedModules,
  useProtocolDetailsForRun,
  useStoredProtocolAnalysis,
} from '.'

import type { ProtocolModuleInfo } from '../ProtocolRun/utils/getProtocolModulesInfo'
import type { AttachedModule } from '../../../redux/modules/types'

export interface ModuleRenderInfoForProtocol extends ProtocolModuleInfo {
  attachedModuleMatch: AttachedModule | null
}

export function useModuleRenderInfoForProtocolById(
  robotName: string,
  runId: string
): {
  [moduleId: string]: ModuleRenderInfoForProtocol
} {
  const { protocolData: robotProtocolAnalysis } = useProtocolDetailsForRun(
    runId
  )
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  const attachedModules = useAttachedModules()
  if (protocolData == null) return {}
  const loadedLabware = getLoadedLabwareFromCommands(protocolData.commands)

  const deckDef = getDeckDefFromRobotType(
    getRobotTypeFromLoadedLabware(loadedLabware)
  )

  const protocolModulesInfo = getProtocolModulesInfo(protocolData, deckDef)

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
              attachedMod.moduleModel,
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
