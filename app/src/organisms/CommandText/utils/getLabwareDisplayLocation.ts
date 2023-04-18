import {
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  LabwareLocation,
  OT2_STANDARD_MODEL,
  RobotType,
} from '@opentrons/shared-data'
import { getModuleDisplayLocation } from './getModuleDisplayLocation'
import { getModuleModel } from './getModuleModel'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data/'
import type { TFunction } from 'react-i18next'
import type { RunData } from '@opentrons/api-client'

export function getLabwareDisplayLocation(
  protocolData: CompletedProtocolAnalysis | RunData,
  location: LabwareLocation,
  t: TFunction<'protocol_command_text'>,
  robotType?: RobotType
): string {
  if (location === 'offDeck') {
    return t('off_deck')
  } else if ('slotName' in location) {
    return t('slot', { slot_name: location.slotName })
  } else if ('moduleId' in location) {
    const moduleModel = getModuleModel(protocolData, location.moduleId)
    if (moduleModel == null) {
      console.warn('labware is located on an unknown module model')
      return ''
    } else if ('robotType' in protocolData) {
      return t('module_in_slot', {
        count: getOccludedSlotCountForModule(
          getModuleType(moduleModel),
          protocolData.robotType ?? OT2_STANDARD_MODEL
        ),
        module: getModuleDisplayName(moduleModel),
        slot_name: getModuleDisplayLocation(protocolData, location.moduleId),
      })
    } else if (robotType != null) {
      return t('module_in_slot', {
        count: getOccludedSlotCountForModule(
          getModuleType(moduleModel),
          robotType
        ),
        module: getModuleDisplayName(moduleModel),
        slot_name: getModuleDisplayLocation(protocolData, location.moduleId),
      })
    } else {
      console.warn(
        'display location could not be determined because robotType was not known'
      )
      return ''
    }
  } else {
    console.warn('display location could not be established: ', location)
    return ''
  }
}
