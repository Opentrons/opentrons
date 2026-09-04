import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { getCalibratedPipetteForModuleSetup } from '/app/local-resources/instruments'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'
import { useAttachedModules } from '/app/resources/modules'

import type { AttachedModule } from '@opentrons/api-client'
import type { ModuleType } from '@opentrons/shared-data'

const MODULES_NOT_REQUIRING_PIPETTE_FOR_SETUP: ModuleType[] = [
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
]
const MODULES_NOT_REQUIRING_CALIBRATION =
  MODULES_NOT_REQUIRING_PIPETTE_FOR_SETUP
const ATTACHED_MODULE_POLL_MS = 5000
const DECK_CONFIG_POLL_MS = 5000

export function useGetModulesNeedingSetup(): AttachedModule[] {
  const attachedModules =
    useAttachedModules({
      refetchInterval: ATTACHED_MODULE_POLL_MS,
    }) ?? []
  const deckConfig = useNotifyDeckConfigurationQuery({
    enabled: attachedModules.length > 0,
    refetchInterval: DECK_CONFIG_POLL_MS,
  }).data
  if (deckConfig != null && attachedModules.length > 0) {
    const modulesInDeckConfig = deckConfig
      ?.filter(c => c.opentronsModuleSerialNumber)
      .map(m => m.opentronsModuleSerialNumber)
    return attachedModules.filter(
      m =>
        m.compatibleWithRobot &&
        (!modulesInDeckConfig.includes(m.serialNumber) ||
          (!MODULES_NOT_REQUIRING_CALIBRATION.includes(m.moduleType) &&
            m.moduleOffset === undefined))
    )
  }
  return []
}

export function useGetModulesNeedingSetupThatCanCurrentlyBeSetUp(): AttachedModule[] {
  const modulesRequiringSetup = useGetModulesNeedingSetup()
  const attachedPipettes = useAttachedPipettesFromInstrumentsQuery()
  const hasCalibratedPipette =
    getCalibratedPipetteForModuleSetup(attachedPipettes) != null
  return modulesRequiringSetup.filter(
    m =>
      MODULES_NOT_REQUIRING_PIPETTE_FOR_SETUP.includes(m.moduleType) ||
      hasCalibratedPipette
  )
}
