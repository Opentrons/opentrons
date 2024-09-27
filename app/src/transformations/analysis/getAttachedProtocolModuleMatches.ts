import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  checkModuleCompatibility,
  getCutoutFixturesForModuleModel,
  getCutoutIdsFromModuleSlotName,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import type { DeckConfiguration, RobotType } from '@opentrons/shared-data'
import type { ProtocolModuleInfo } from '/app/transformations/analysis'
import type { AttachedModule } from '/app/redux/modules/types'

export type AttachedProtocolModuleMatch = ProtocolModuleInfo & {
  attachedModuleMatch: AttachedModule | null
}

// NOTE: some logic copied from useModuleRenderInfoForProtocolById
export function getAttachedProtocolModuleMatches(
  attachedModules: AttachedModule[],
  protocolModulesInfo: ProtocolModuleInfo[],
  deckConfig: DeckConfiguration,
  robotType: RobotType = FLEX_ROBOT_TYPE
): AttachedProtocolModuleMatch[] {
  const deckDef = getDeckDefFromRobotType(robotType)
  const robotSupportsModuleConfig = robotType !== OT2_ROBOT_TYPE
  const matchedAttachedModules: AttachedModule[] = []
  const attachedProtocolModuleMatches = protocolModulesInfo.map(
    protocolModule => {
      const moduleFixtures = getCutoutFixturesForModuleModel(
        protocolModule.moduleDef.model,
        deckDef
      )
      const moduleCutoutIds = getCutoutIdsFromModuleSlotName(
        protocolModule.slotName,
        moduleFixtures,
        deckDef
      )
      const compatibleAttachedModule =
        attachedModules.find(
          attachedModule =>
            checkModuleCompatibility(
              attachedModule.moduleModel,
              protocolModule.moduleDef.model
            ) &&
            // check id instead of object reference in useModuleRenderInfoForProtocolById
            !matchedAttachedModules.some(
              matchedAttachedModule =>
                matchedAttachedModule.serialNumber ===
                attachedModule.serialNumber
            ) &&
            // then if robotType supports configurable modules check the deck config has a
            // a module with the expected serial number in the expected location
            (!robotSupportsModuleConfig ||
              deckConfig.some(
                ({ cutoutId, opentronsModuleSerialNumber }) =>
                  attachedModule.serialNumber === opentronsModuleSerialNumber &&
                  moduleCutoutIds.includes(cutoutId)
              ))
        ) ?? null
      if (compatibleAttachedModule !== null) {
        matchedAttachedModules.push(compatibleAttachedModule)
        return {
          ...protocolModule,
          attachedModuleMatch: compatibleAttachedModule,
        }
      }
      return {
        ...protocolModule,
        attachedModuleMatch: null,
      }
    }
  )
  return attachedProtocolModuleMatches
}
