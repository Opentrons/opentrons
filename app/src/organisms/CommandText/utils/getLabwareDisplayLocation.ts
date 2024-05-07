import {
  getLabwareDefURI,
  getLabwareDisplayName,
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  LabwareLocation,
} from '@opentrons/shared-data'
import { getModuleDisplayLocation } from './getModuleDisplayLocation'
import { getModuleModel } from './getModuleModel'
import { getLabwareDefinitionsFromCommands } from '../../LabwarePositionCheck/utils/labware'
import type { RobotType } from '@opentrons/shared-data'
import type { TFunction } from 'i18next'
import type { CommandTextData } from '../types'

export function getLabwareDisplayLocation(
  protocolData: CommandTextData,
  location: LabwareLocation,
  t: TFunction,
  robotType: RobotType,
  isOnDevice?: boolean
): string {
  if (location === 'offDeck') {
    return t('off_deck')
  } else if ('slotName' in location) {
    return isOnDevice
      ? location.slotName
      : t('slot', { slot_name: location.slotName })
  } else if ('addressableAreaName' in location) {
    return isOnDevice
      ? location.addressableAreaName
      : t('slot', { slot_name: location.addressableAreaName })
  } else if ('moduleId' in location) {
    const moduleModel = getModuleModel(protocolData, location.moduleId)
    if (moduleModel == null) {
      console.warn('labware is located on an unknown module model')
      return ''
    } else {
      const slotName = getModuleDisplayLocation(protocolData, location.moduleId)
      return isOnDevice
        ? `${getModuleDisplayName(moduleModel)}, ${slotName}`
        : t('module_in_slot', {
            count: getOccludedSlotCountForModule(
              getModuleType(moduleModel),
              robotType
            ),
            module: getModuleDisplayName(moduleModel),
            slot_name: slotName,
          })
    }
  } else if ('labwareId' in location) {
    const adapter = protocolData.labware.find(
      lw => lw.id === location.labwareId
    )
    const allDefs = getLabwareDefinitionsFromCommands(protocolData.commands)
    const adapterDef = allDefs.find(
      def => getLabwareDefURI(def) === adapter?.definitionUri
    )
    const adapterDisplayName =
      adapterDef != null ? getLabwareDisplayName(adapterDef) : ''

    if (adapter == null) {
      console.warn('labware is located on an unknown adapter')
      return ''
    } else if (adapter.location === 'offDeck') {
      return t('off_deck')
    } else if ('slotName' in adapter.location) {
      return t('adapter_in_slot', {
        adapter: adapterDisplayName,
        slot: adapter.location.slotName,
      })
    } else if ('addressableAreaName' in adapter.location) {
      return t('adapter_in_slot', {
        adapter: adapterDisplayName,
        slot: adapter.location.addressableAreaName,
      })
    } else if ('moduleId' in adapter.location) {
      const moduleIdUnderAdapter = adapter.location.moduleId
      const moduleModel = protocolData.modules.find(
        module => module.id === moduleIdUnderAdapter
      )?.model
      if (moduleModel == null) {
        console.warn('labware is located on an adapter on an unknown module')
        return ''
      }
      const slotName = getModuleDisplayLocation(
        protocolData,
        adapter.location.moduleId
      )
      return t('adapter_in_mod_in_slot', {
        count: getOccludedSlotCountForModule(
          getModuleType(moduleModel),
          robotType
        ),
        module: getModuleDisplayName(moduleModel),
        adapter: adapterDisplayName,
        slot: slotName,
      })
    } else {
      console.warn(
        'display location on adapter could not be established: ',
        location
      )
      return ''
    }
  } else {
    console.warn('display location could not be established: ', location)
    return ''
  }
}
