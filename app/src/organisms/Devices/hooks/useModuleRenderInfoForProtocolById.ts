import {
  checkModuleCompatibility,
  Fixture,
  getDeckDefFromRobotType,
  getRobotTypeFromLoadedLabware,
  STANDARD_SLOT_LOAD_NAME,
} from '@opentrons/shared-data'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client/src/deck_configuration'

import { getProtocolModulesInfo } from '../ProtocolRun/utils/getProtocolModulesInfo'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useAttachedModules } from './useAttachedModules'
import { useStoredProtocolAnalysis } from './useStoredProtocolAnalysis'

import type { AttachedModule } from '../../../redux/modules/types'
import type { ProtocolModuleInfo } from '../ProtocolRun/utils/getProtocolModulesInfo'

export interface ModuleRenderInfoForProtocol extends ProtocolModuleInfo {
  attachedModuleMatch: AttachedModule | null
  conflictedFixture?: Fixture
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
      if (compatibleAttachedModule !== null) {
        matchedAmod = [...matchedAmod, compatibleAttachedModule]
        return {
          ...protocolMod,
          attachedModuleMatch: compatibleAttachedModule,
          conflictedFixture: deckConfig?.find(
            fixture =>
              fixture.fixtureLocation === protocolMod.slotName &&
              fixture.loadName !== STANDARD_SLOT_LOAD_NAME
          ),
        }
      }
      return {
        ...protocolMod,
        attachedModuleMatch: null,
        conflictedFixture: deckConfig?.find(
          fixture =>
            fixture.fixtureLocation === protocolMod.slotName &&
            fixture.loadName !== STANDARD_SLOT_LOAD_NAME
        ),
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
