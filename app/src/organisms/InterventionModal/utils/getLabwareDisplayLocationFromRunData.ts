import {
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  LabwareLocation,
  RobotType,
} from '@opentrons/shared-data'

import { getModuleDisplayLocationFromRunData } from './getModuleDisplayLocationFromRunData'
import { getModuleModelFromRunData } from './getModuleModelFromRunData'

import type { TFunction } from 'react-i18next'
import type { RunData } from '@opentrons/api-client'

export function getLabwareDisplayLocationFromRunData(
  protocolData: RunData,
  location: LabwareLocation,
  t: TFunction<'protocol_command_text'>,
  robotType: RobotType
): string {
  if (location === 'offDeck') {
    return t('off_deck')
  } else if ('slotName' in location) {
    return t('slot', { slot_name: location.slotName })
  } else if ('moduleId' in location) {
    const moduleModel = getModuleModelFromRunData(
      protocolData,
      location.moduleId
    )
    if (moduleModel == null) {
      console.warn('labware is located on an unknown module model')
      return ''
    } else {
      return t('module_in_slot', {
        count: getOccludedSlotCountForModule(
          getModuleType(moduleModel),
          robotType
        ),
        module: getModuleDisplayName(moduleModel),
        slot_name: getModuleDisplayLocationFromRunData(
          protocolData,
          location.moduleId
        ),
      })
    }
  } else {
    console.warn('display location could not be established: ', location)
    return ''
  }
}
