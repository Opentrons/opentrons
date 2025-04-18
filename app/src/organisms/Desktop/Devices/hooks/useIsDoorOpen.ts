import { useSelector } from 'react-redux'

import { useDoorQuery, useModulesQuery } from '@opentrons/react-api-client'

import { getRobotSettings } from '/app/redux/robot-settings'
import { useIsFlex } from '/app/redux-resources/robots'
import { EQUIPMENT_POLL_MS } from '../ProtocolRun/ProtocolRunHeader/constants'

import type { State } from '/app/redux/types'
import { AttachedModule, FlexStackerData } from '@opentrons/api-client'

import {
  FLEX_STACKER_MODULE_TYPE,
  CutoutConfig,
  getCutoutDisplayName,
} from '@opentrons/shared-data'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

export const NOT_CONFIGURED: 'moduleLocationNotConfigured' =
  'moduleLocationNotConfigured'
export type DoorResult = {
  isDoorOpen: boolean
  moduleDoorLocation: string | typeof NOT_CONFIGURED | null
}

function identifyDooredModuleSlot(
  module: AttachedModule,
  cutout: CutoutConfig
): string {
  var slot = getCutoutDisplayName(cutout.cutoutId)
  if (module.moduleType === FLEX_STACKER_MODULE_TYPE) {
    slot = slot.replace('3', '4')
  }

  return slot
}

export function useIsDoorOpen(robotName: string): DoorResult {
  const doorResult: DoorResult = { isDoorOpen: false, moduleDoorLocation: null }
  const robotSettings = useSelector((state: State) =>
    getRobotSettings(state, robotName)
  )
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
