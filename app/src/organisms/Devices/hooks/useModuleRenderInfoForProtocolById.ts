import {
  checkModuleCompatibility,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import { getProtocolModulesInfo } from '../ProtocolRun/utils/getProtocolModulesInfo'
import {
  useAttachedModules,
  useProtocolDetailsForRun,
  useStoredProtocolAnalysis,
} from '.'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import type { ProtocolModuleInfo } from '../ProtocolRun/utils/getProtocolModulesInfo'
import type { AttachedModule } from '../../../redux/modules/types'

export interface ModuleRenderInfoForProtocol extends ProtocolModuleInfo {
  attachedModuleMatch: AttachedModule | null
}

export interface ModuleRenderInfoById {
  [moduleId: string]: ModuleRenderInfoForProtocol
}

export function useModuleRenderInfoForProtocolById(
  robotName: string,
  runId: string
): ModuleRenderInfoById {
  const { robotType } = useProtocolDetailsForRun(runId)
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)

  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  const attachedModules = useAttachedModules()
  if (protocolData == null) return {}

  const deckDef = getDeckDefFromRobotType(robotType)

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
