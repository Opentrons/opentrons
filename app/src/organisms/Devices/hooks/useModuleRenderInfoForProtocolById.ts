import {
  checkModuleCompatibility,
  FLEX_ROBOT_TYPE,
  getCutoutFixturesForModuleModel,
  getCutoutIdsFromModuleSlotName,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client'

import { getProtocolModulesInfo } from '../ProtocolRun/utils/getProtocolModulesInfo'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useAttachedModules } from './useAttachedModules'
import { useStoredProtocolAnalysis } from './useStoredProtocolAnalysis'

import type { CutoutConfig } from '@opentrons/shared-data'
import type { AttachedModule } from '../../../redux/modules/types'
import type { ProtocolModuleInfo } from '../ProtocolRun/utils/getProtocolModulesInfo'

export interface ModuleRenderInfoForProtocol extends ProtocolModuleInfo {
  attachedModuleMatch: AttachedModule | null
  conflictedFixture: CutoutConfig | null
}

export interface ModuleRenderInfoById {
  [moduleId: string]: ModuleRenderInfoForProtocol
}

const REFETCH_INTERVAL_5000_MS = 5000

export function useModuleRenderInfoForProtocolById(
  runId: string,
  pollModules?: boolean
): ModuleRenderInfoById {
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const { data: deckConfig } = useDeckConfigurationQuery({
    refetchInterval: REFETCH_INTERVAL_5000_MS,
  })
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis
  const attachedModules = useAttachedModules({
    refetchInterval: pollModules ? REFETCH_INTERVAL_5000_MS : false,
  })
  if (protocolAnalysis == null) return {}

  const deckDef = getDeckDefFromRobotType(
    protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  )

  const protocolModulesInfo = getProtocolModulesInfo(protocolAnalysis, deckDef)

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

      const moduleFixtures = getCutoutFixturesForModuleModel(protocolMod.moduleDef.model, deckDef)
      const moduleCutoutIds = getCutoutIdsFromModuleSlotName(protocolMod.slotName, moduleFixtures)

      const conflictedFixture =
        deckConfig?.find(
          fixture =>
            moduleCutoutIds.includes(fixture.cutoutId) ||
            fixture.cutoutFixtureId != null
        ) ?? null

      if (compatibleAttachedModule !== null) {
        matchedAmod = [...matchedAmod, compatibleAttachedModule]
        return {
          ...protocolMod,
          attachedModuleMatch: compatibleAttachedModule,
          conflictedFixture,
        }
      }
      return {
        ...protocolMod,
        attachedModuleMatch: null,
        conflictedFixture,
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
