import {
  DeckConfiguration,
  FLEX_ROBOT_TYPE,
  NON_CONNECTING_MODULE_TYPES,
  checkModuleCompatibility,
  getCutoutFixturesForModuleModel,
  getCutoutIdsFromModuleSlotName,
  getDeckDefFromRobotType,
  getModuleType,
} from '@opentrons/shared-data'

import type { ProtocolModuleInfo } from '../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import type { AttachedModule } from '../../redux/modules/types'

export type AttachedProtocolModuleMatch = ProtocolModuleInfo & {
  attachedModuleMatch: AttachedModule | null
}

// some logic copied from useModuleRenderInfoForProtocolById
export function getAttachedProtocolModuleMatches(
  attachedModules: AttachedModule[],
  protocolModulesInfo: ProtocolModuleInfo[],
  deckConfig: DeckConfiguration
): AttachedProtocolModuleMatch[] {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE) // this is only used for Flex ODD
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
            // check deck config has module with expected serial number in expected location
            deckConfig.some(
              ({ cutoutId, opentronsModuleSerialNumber }) =>
                attachedModule.serialNumber === opentronsModuleSerialNumber &&
                moduleCutoutIds.includes(cutoutId)
            )
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

interface UnmatchedModuleResults {
  missingModuleIds: string[]
  remainingAttachedModules: AttachedModule[]
}

// get requested protocol module ids that do not map to a robot-attached module of the requested model
// some logic copied from useUnmatchedModulesForProtocol
export function getUnmatchedModulesForProtocol(
  attachedModules: AttachedModule[],
  protocolModulesInfo: ProtocolModuleInfo[]
): UnmatchedModuleResults {
  const {
    missingModuleIds,
    remainingAttachedModules,
  } = protocolModulesInfo.reduce<UnmatchedModuleResults>(
    (acc, module) => {
      const { model, compatibleWith } = module.moduleDef
      // Skip matching any modules that don't require an electronic robot connection
      if (NON_CONNECTING_MODULE_TYPES.includes(getModuleType(model))) return acc
      // for this required module, find a remaining (unmatched) attached module of the requested model
      const moduleTypeMatchIndex = acc.remainingAttachedModules.findIndex(
        attachedModule => {
          return (
            model === attachedModule.moduleModel ||
            compatibleWith.includes(attachedModule.moduleModel)
          )
        }
      )
      return moduleTypeMatchIndex !== -1
        ? {
            ...acc,
            // remove matched module from remaining modules list
            remainingAttachedModules: acc.remainingAttachedModules.filter(
              (_remainingAttachedModule, index) =>
                index !== moduleTypeMatchIndex
            ),
          }
        : {
            ...acc,
            // append unmatchable module to list of requested modules that are missing a physical match
            missingModuleIds: [...acc.missingModuleIds, module.moduleId],
          }
    },
    { missingModuleIds: [], remainingAttachedModules: attachedModules }
  )
  return { missingModuleIds, remainingAttachedModules }
}
