import { useTranslation } from 'react-i18next'
import {
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  OT2_STANDARD_MODEL,
} from '@opentrons/shared-data'
import { getModuleDisplayLocation } from './utils/getModuleDisplayLocation'
import { getModuleModel } from './utils/getModuleModel'
import type {
  CompletedProtocolAnalysis,
  MoveLabwareRunTimeCommand
} from '@opentrons/shared-data/'
import { getLabwareName } from './utils'
import { LabwareDisplayLocation } from './LabwareDisplayLocation'

interface MoveLabwareCommandTextProps {
  command: MoveLabwareRunTimeCommand
  robotSideAnalysis: CompletedProtocolAnalysis
}
export function MoveLabwareCommandText(props: MoveLabwareCommandTextProps): JSX.Element {
  const { t } = useTranslation('protocol_command_text')
  const { command, robotSideAnalysis } = props
  const { labwareId, newLocation, strategy } = command.params

  let newDisplayLocation = ''
  if (newLocation === 'offDeck') {
    newDisplayLocation = t('off_deck')
  } else if ('slotName' in newLocation) {
    newDisplayLocation = t('slot', { slot_name: newLocation.slotName })
  } else if ('moduleId' in newLocation) {
    const moduleModel = getModuleModel(
      robotSideAnalysis,
      newLocation.moduleId
    )
    if (moduleModel == null) {
      console.warn('labware is located on an unknown module model')
      newDisplayLocation = ''
    } else {
      newDisplayLocation = t('module_in_slot', {
        count: getOccludedSlotCountForModule(
          getModuleType(moduleModel),
          robotSideAnalysis.robotType ?? OT2_STANDARD_MODEL
        )
        ,
        module: getModuleDisplayName(moduleModel),
        slot_name: getModuleDisplayLocation(
          robotSideAnalysis,
          newLocation.moduleId
        ),
      })
    }
  }

  return strategy === 'usingGripper'
    ? t('move_labware_using_gripper', {
      labware: getLabwareName(robotSideAnalysis, labwareId),
      old_location: <LabwareDisplayLocation {...{ robotSideAnalysis, labwareId }} />,
      new_location: newLocation
    })
    : t('move_labware_manually', {
      labware: getLabwareName(robotSideAnalysis, labwareId),
      old_location: <LabwareDisplayLocation {...{ robotSideAnalysis, labwareId }} />,
      new_location: newLocation
    })
}
