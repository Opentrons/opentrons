import {
  useDoorQuery,
  useModulesQuery,
  useRobotSettingsQuery,
} from '@opentrons/react-api-client'
import {
  FLEX_STACKER_MODULE_TYPE,
  getCutoutDisplayName,
} from '@opentrons/shared-data'

import { useIsFlex } from '/app/redux-resources/robots'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { EQUIPMENT_POLL_MS } from './constants'

import type { AttachedModule } from '@opentrons/api-client'
import type { CutoutConfig } from '@opentrons/shared-data'

export const NOT_CONFIGURED: 'moduleLocationNotConfigured' =
  'moduleLocationNotConfigured'
export interface DoorResult {
  isDoorOpen: boolean
  moduleDoorLocation: string | typeof NOT_CONFIGURED | null
}

function identifyDooredModuleSlot(
  module: AttachedModule,
  cutout: CutoutConfig
): string {
  let slot = getCutoutDisplayName(cutout.cutoutId)
  if (module.moduleType === FLEX_STACKER_MODULE_TYPE) {
    slot = slot.replace('3', '4')
  }

  return slot
}

export function useIsDoorOpen(robotName: string): DoorResult {
  const doorResult: DoorResult = { isDoorOpen: false, moduleDoorLocation: null }
  const robotSettingsQuery = useRobotSettingsQuery()
  const robotSettings = robotSettingsQuery.data?.settings ?? []
  const isFlex = useIsFlex(robotName)

  const doorSafetySetting = robotSettings.find(
    setting => setting.id === 'enableDoorSafetySwitch'
  )

  const { data: doorStatus } = useDoorQuery({
    refetchInterval: EQUIPMENT_POLL_MS,
  })

  const isStatusOpen = doorStatus?.data.status === 'open'
  const isDoorSafetyEnabled = Boolean(doorSafetySetting?.value)

  const attachedModules =
    useModulesQuery({
      refetchInterval: EQUIPMENT_POLL_MS,
      enabled: isStatusOpen,
    })?.data?.data ?? []

  // TODO (cb, 04-17-2025): If other doored modules are introduced this logic will need a refresh
  const attachedStacker =
    attachedModules.find(
      (i): i is AttachedModule =>
        i.moduleType === FLEX_STACKER_MODULE_TYPE &&
        i.data.hopperDoorState === 'opened'
    ) ?? null

  const deckConfig = useNotifyDeckConfigurationQuery({
    enabled: attachedModules !== null,
  }).data

  if (attachedStacker && deckConfig) {
    const stackerCutout =
      deckConfig.find(
        (i): i is CutoutConfig =>
          i.opentronsModuleSerialNumber === attachedStacker.serialNumber
      ) ?? null

    if (stackerCutout) {
      doorResult.moduleDoorLocation = identifyDooredModuleSlot(
        attachedStacker,
        stackerCutout
      )
    } else {
      doorResult.moduleDoorLocation = NOT_CONFIGURED
    }
  }

  if (isFlex || (!isFlex && isDoorSafetyEnabled)) {
    doorResult.isDoorOpen = isStatusOpen
  } else {
    doorResult.isDoorOpen = false
  }

  return doorResult
}
