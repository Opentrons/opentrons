import {
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  LabwareLocation,
  OT2_STANDARD_MODEL,
} from '@opentrons/shared-data'
import { getModuleDisplayLocation } from './getModuleDisplayLocation'
import { getModuleModel } from './getModuleModel'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data/'
import type { TFunction } from 'react-i18next'

export function getLabwareDisplayLocation(
  robotSideAnalysis: CompletedProtocolAnalysis,
  location: LabwareLocation,
  t: TFunction<'protocol_command_text'>,
  isOnDevice?: boolean
): string {
  if (location === 'offDeck') {
    return t('off_deck')
  } else if ('slotName' in location) {
    return isOnDevice
      ? location.slotName
      : t('slot', { slot_name: location.slotName })
  } else if ('moduleId' in location) {
    const moduleModel = getModuleModel(robotSideAnalysis, location.moduleId)
    if (moduleModel == null) {
      console.warn('labware is located on an unknown module model')
      return ''
    } else {
      const slotName = getModuleDisplayLocation(
        robotSideAnalysis,
        location.moduleId
      )
      return isOnDevice
        ? `${location.moduleId}, ${slotName}`
        : t('module_in_slot', {
            count: getOccludedSlotCountForModule(
              getModuleType(moduleModel),
              robotSideAnalysis.robotType ?? OT2_STANDARD_MODEL
            ),
            module: getModuleDisplayName(moduleModel),
            slot_name: slotName,
          })
    }
  } else {
    console.warn('display location could not be established: ', location)
    return ''
  }
}
