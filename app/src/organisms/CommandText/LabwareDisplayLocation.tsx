import {
  CompletedProtocolAnalysis,
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  OT2_STANDARD_MODEL,
} from '@opentrons/shared-data'
import { useTranslation } from 'react-i18next'
import { getLoadedLabware } from './utils/accessors'
import { getModuleDisplayLocation } from './utils/getModuleDisplayLocation'
import { getModuleModel } from './utils/getModuleModel'

interface LabwareDisplayLocationProps {
  robotSideAnalysis: CompletedProtocolAnalysis
  labwareId: string
}

export function LabwareDisplayLocation(
  props: LabwareDisplayLocationProps
): JSX.Element | null {
  const { t } = useTranslation('protocol_command_text')
  const { robotSideAnalysis, labwareId } = props
  const loadedLabware = getLoadedLabware(robotSideAnalysis, labwareId)

  if (loadedLabware == null || loadedLabware.location === 'offDeck') {
    return t('off_deck')
  } else if ('slotName' in loadedLabware.location) {
    return t('slot', { slot_name: loadedLabware.location.slotName })
  } else if ('moduleId' in loadedLabware.location) {
    const moduleModel = getModuleModel(
      robotSideAnalysis,
      loadedLabware.location.moduleId
    )
    if (moduleModel == null) {
      console.warn('labware is located on an unknown module model')
      return null
    }
    const occludedSlotCount = getOccludedSlotCountForModule(
      getModuleType(moduleModel),
      robotSideAnalysis.robotType ?? OT2_STANDARD_MODEL
    )
    return t('module_in_slot', {
      count: occludedSlotCount,
      module: getModuleDisplayName(moduleModel),
      slot_name: getModuleDisplayLocation(
        robotSideAnalysis,
        loadedLabware.location.moduleId
      ),
    })
  } else {
    console.warn(
      'display location could not be established for labware with id: ',
      labwareId
    )
    return null
  }
}
