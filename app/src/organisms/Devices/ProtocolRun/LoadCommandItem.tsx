// @ts-nocheck
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { getModuleDisplayName, getModuleType, getOccludedSlotCountForModule } from '@opentrons/shared-data'
import { getSlotLabwareName } from './utils/getSlotLabwareName'

import { StyledText } from '../../../atoms/text'

import type { RunTimeCommand, CompletedProtocolAnalysis } from '@opentrons/shared-data'
import { getPipetteNameSpecs, OT2_STANDARD_MODEL } from '@opentrons/shared-data/js'

interface LoadCommandItemProps {
  command: RunTimeCommand
  robotSideAnalysis: CompletedProtocolAnalysis
}

export const LoadCommandItem = ({
  command,
  robotSideAnalysis,
}: LoadCommandItemProps): JSX.Element | null => {
  const { t } = useTranslation('run_details')

  const { labware = [], modules = [], pipettes, liquids, robotType } = robotSideAnalysis
  // TODO FOR TOMORROW:
  // write a series of helper functions which get entities by id from the two params of analysis and id
  // e.g.  getLabware(robotSideAnalysis, labwareId) 
  // these functions should have predictable and consistent error handling
  // they should also handle lookup migrations from analysis version to analysis version. hopefully sequestering these changes in a clear way
  console.table({modules, labware})
  let commandText

  switch (command.commandType) {
    case 'loadPipette': {
      const pipetteData = pipettes.find(p => p.mount === command.params.mount)
      if (pipetteData == null) return null
      commandText = t('load_pipette_protocol_setup', {
        pipette_name: getPipetteNameSpecs(pipetteData)?.displayName,
        mount_name: command.params.mount === 'left' ? t('left') : t('right'),
      })
      break
    }
    case 'loadModule': {
      const occludedSlotCount = getOccludedSlotCountForModule(getModuleType(command.params.model, robotType ?? OT2_STANDARD_MODEL))
      commandText = (
        t("load_modules_protocol_setup", {
          count: occludedSlotCount,
          module: getModuleDisplayName(moduleModel.model),
          slot_name: command.params.location === 'offDeck' ? t('off_deck') : command.params.location?.slotName,
        })
      )
      break
    }
    case 'loadLabware': {
      if (command.params.location !== 'offDeck' && 'moduleId' in command.params.location) {
        const moduleData = modules.find(m => m.id === command.params.location.moduleId)
        moduleName = getModuleDisplayName(moduleData.model)
        commandText = t("load_labware_info_protocol_setup", {
          count: getOccludedSlotCountForModule(getModuleType(moduleData.model)),
          labware: command.result?.definition.metadata.displayName,
          slot_name: moduleData.location.slotName,
          module_name: moduleName,
        })
      } else {
        const labwareLocation = labware[command.params.labwareId].location
        commandText = t("load_labware_info_protocol_setup_no_module",
          {
            labware_loadname: command.result?.definition.metadata.displayName,
            slot_name: labwareLocation === 'offDeck' ? t('off_deck') : labwareLocation?.slotName,
          }
        )
      }
      break
    }
    case 'loadLiquid': {
      const { liquidId, labwareId } = command.params
      const liquidDisplayName = liquids.find(liquid => liquid.id === liquidId)
        ?.displayName
      commandText = (
        t('load_liquids_info_protocol_setup', {
          liquid: liquidDisplayName ?? 'liquid',
          labware: getSlotLabwareName(labwareId, protocolData.commands).labwareName,
        })
      )
      break
    }
  }

  return (
    <StyledText as="p">{commandText}</StyledText>
  )
}
