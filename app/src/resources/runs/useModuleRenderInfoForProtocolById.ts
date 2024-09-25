import {
  checkModuleCompatibility,
  FLEX_ROBOT_TYPE,
  getCutoutFixturesForModuleModel,
  getCutoutIdsFromModuleSlotName,
  getDeckDefFromRobotType,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { getProtocolModulesInfo } from '/app/transformations/analysis'
import { useAttachedModules } from '/app/resources/modules'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useMostRecentCompletedAnalysis } from './useMostRecentCompletedAnalysis'

import type { CutoutConfig } from '@opentrons/shared-data'
import type { AttachedModule } from '/app/redux/modules/types'
import type { ProtocolModuleInfo } from '/app/transformations/analysis'

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
  const { data: deckConfig = [] } = useNotifyDeckConfigurationQuery({
    refetchInterval: REFETCH_INTERVAL_5000_MS,
  })
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis
  const attachedModules = useAttachedModules({
    refetchInterval: pollModules ? REFETCH_INTERVAL_5000_MS : false,
  })
  if (protocolAnalysis == null) return {}

  const assumedRobotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckDef = getDeckDefFromRobotType(assumedRobotType)

  const protocolModulesInfo = getProtocolModulesInfo(protocolAnalysis, deckDef)

  const protocolModulesInfoInLoadOrder = protocolModulesInfo.sort(
    (modA, modB) => modA.protocolLoadOrder - modB.protocolLoadOrder
  )

  const robotSupportsModuleConfig = assumedRobotType !== OT2_ROBOT_TYPE
  let matchedAmod: AttachedModule[] = []
  const allModuleRenderInfo = protocolModulesInfoInLoadOrder.map(
    protocolMod => {
      const moduleFixtures = getCutoutFixturesForModuleModel(
        protocolMod.moduleDef.model,
        deckDef
      )
      const moduleCutoutIds = getCutoutIdsFromModuleSlotName(
        protocolMod.slotName,
        moduleFixtures,
        deckDef
      )
      const compatibleAttachedModule =
        attachedModules.find(
          attachedMod =>
            // first check module model compatibility
            checkModuleCompatibility(
              attachedMod.moduleModel,
              protocolMod.moduleDef.model
            ) &&
            // then check that the module hasn't already been matched
            !matchedAmod.some(
              m => m.serialNumber === attachedMod.serialNumber
            ) &&
            // then if robotType supports configurable modules check the deck config has a
            // a module with the expected serial number in the expected location
            (!robotSupportsModuleConfig ||
              deckConfig.some(
                ({ cutoutId, opentronsModuleSerialNumber }) =>
                  attachedMod.serialNumber === opentronsModuleSerialNumber &&
                  moduleCutoutIds.includes(cutoutId)
              ))
        ) ?? null

      const conflictedFixture =
        deckConfig?.find(
          ({ cutoutId, cutoutFixtureId }) =>
            moduleCutoutIds.includes(cutoutId) &&
            !moduleFixtures.some(({ id }) => cutoutFixtureId === id) &&
            // if robotType supports module config, don't treat module fixture as conflict
            (!robotSupportsModuleConfig || compatibleAttachedModule == null)
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
