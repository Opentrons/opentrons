// @ts-nocheck
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
} from '@opentrons/shared-data'
import {
  getPipetteNameSpecs,
  OT2_STANDARD_MODEL,
} from '@opentrons/shared-data/js'

import { StyledText } from '../../atoms/text'

import type {
  RunTimeCommand,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'
import {
  getLabwareName,
  getPipetteNameOnMount,
  getModuleModel,
  getModuleDisplayLocation,
  getLiquidDisplayName,
} from './utils'

interface LoadCommandTextProps {
  command: RunTimeCommand
  robotSideAnalysis: CompletedProtocolAnalysis
}

export const LoadCommandText = ({
  command,
  robotSideAnalysis,
}: LoadCommandTextProps): JSX.Element | null => {
  const { t } = useTranslation('run_details')

  let commandText

  switch (command.commandType) {
    case 'loadPipette': {
      const pipetteModel = getPipetteNameOnMount(
        robotSideAnalysis,
        command.params.mount
      )
      commandText = t('load_pipette_protocol_setup', {
        pipette_name:
          pipetteModel != null
            ? getPipetteNameSpecs(pipetteModel)?.displayName ?? ''
            : '',
        mount_name: command.params.mount === 'left' ? t('left') : t('right'),
      })
      break
    }
    case 'loadModule': {
      const occludedSlotCount = getOccludedSlotCountForModule(
        getModuleType(
          command.params.model,
          robotSideAnalysis.robotType ?? OT2_STANDARD_MODEL
        )
      )
      commandText = t('load_module_protocol_setup', {
        count: occludedSlotCount,
        module: getModuleDisplayName(command.params.model),
        slot_name:
          command.params.location === 'offDeck'
            ? t('off_deck')
            : command.params.location?.slotName,
      })
      break
    }
    case 'loadLabware': {
      if (
        command.params.location !== 'offDeck' &&
        'moduleId' in command.params.location
      ) {
        const moduleModel = getModuleModel(
          robotSideAnalysis,
          command.params.location.moduleId
        )
        const moduleName =
          moduleModel != null ? getModuleDisplayName(moduleModel) : ''

        commandText = t('load_labware_info_protocol_setup', {
          count: getOccludedSlotCountForModule(getModuleType(moduleModel)),
          labware: command.result?.definition.metadata.displayName,
          slot_name: getModuleDisplayLocation(
            robotSideAnalysis,
            command.params.location.moduleId
          ),
          module_name: moduleName,
        })
      } else {
        const labware = command.result?.definition.metadata.displayName
        commandText = command.params.location === 'offDeck'
          ? t('load_labware_info_protocol_setup_off_deck', { labware })
          : t('load_labware_info_protocol_setup_no_module', {
            labware,
            slot_name: command.params.location?.slotName,
          })
      }
      break
    }
    case 'loadLiquid': {
      const { liquidId, labwareId } = command.params
      commandText = t('load_liquids_info_protocol_setup', {
        liquid: getLiquidDisplayName(robotSideAnalysis, liquidId),
        labware: getLabwareName(robotSideAnalysis, labwareId),
      })
      break
    }
  }

  return commandText
}
