import {
  checkModuleCompatibility,
  getDeckDefFromRobotType,
  getRobotTypeFromLoadedLabware,
  SINGLE_SLOT_FIXTURES,
} from '@opentrons/shared-data'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client/src/deck_configuration'

import { getCutoutIdForSlotName } from '../../../resources/deck_configuration/utils'
import { getProtocolModulesInfo } from '../ProtocolRun/utils/getProtocolModulesInfo'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useAttachedModules } from './useAttachedModules'
import { useStoredProtocolAnalysis } from './useStoredProtocolAnalysis'

import type { CutoutConfig } from '@opentrons/shared-data'
import type { AttachedModule } from '../../../redux/modules/types'
import type { ProtocolModuleInfo } from '../ProtocolRun/utils/getProtocolModulesInfo'

export interface ModuleRenderInfoForProtocol extends ProtocolModuleInfo {
  attachedModuleMatch: AttachedModule | null
  conflictedFixture?: CutoutConfig
}

export interface ModuleRenderInfoById {
  [moduleId: string]: ModuleRenderInfoForProtocol
}

export function useModuleRenderInfoForProtocolById(
  robotName: string,
  runId: string
): ModuleRenderInfoById {
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const { data: deckConfig } = useDeckConfigurationQuery()
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  const robotType = getRobotTypeFromLoadedLabware(protocolData?.labware ?? [])
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

      const cutoutIdForSlotName = getCutoutIdForSlotName(
        protocolMod.slotName,
        deckDef
      )

      const conflictedFixture = deckConfig?.find(
        fixture =>
          fixture.cutoutId === cutoutIdForSlotName &&
          fixture.cutoutFixtureId != null &&
          !SINGLE_SLOT_FIXTURES.includes(fixture.cutoutFixtureId)
      )

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
