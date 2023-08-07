import { useTranslation } from 'react-i18next'
import {
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  LoadAdapterRunTimeCommand,
} from '@opentrons/shared-data'
import {
  getPipetteNameSpecs,
  OT2_STANDARD_MODEL,
} from '@opentrons/shared-data/js'

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

  switch (command.commandType) {
    case 'loadPipette': {
      const pipetteModel = getPipetteNameOnMount(
        robotSideAnalysis,
        command.params.mount
      )
      return t('load_pipette_protocol_setup', {
        pipette_name:
          pipetteModel != null
            ? getPipetteNameSpecs(pipetteModel)?.displayName ?? ''
            : '',
        mount_name: command.params.mount === 'left' ? t('left') : t('right'),
      })
    }
    case 'loadModule': {
      const occludedSlotCount = getOccludedSlotCountForModule(
        getModuleType(command.params.model),
        robotSideAnalysis.robotType ?? OT2_STANDARD_MODEL
      )
      return t('load_module_protocol_setup', {
        count: occludedSlotCount,
        module: getModuleDisplayName(command.params.model),
        slot_name: command.params.location.slotName,
      })
    }
    case 'loadAdapter': {
      console.log(command)
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

        return t('load_labware_info_protocol_setup', {
          count:
            moduleModel != null
              ? getOccludedSlotCountForModule(
                  getModuleType(moduleModel),
                  robotSideAnalysis.robotType ?? OT2_STANDARD_MODEL
                )
              : 1,
          labware: command.result?.definition.metadata.displayName,
          slot_name: getModuleDisplayLocation(
            robotSideAnalysis,
            command.params.location.moduleId
          ),
          module_name: moduleName,
        })
      } else {
        const labware = command.result?.definition.metadata.displayName
        return command.params.location === 'offDeck'
          ? t('load_labware_info_protocol_setup_off_deck', { labware })
          : t('load_labware_info_protocol_setup_no_module', {
              labware,
              slot_name: command.params.location?.slotName,
            })
      }
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

        return t('load_labware_info_protocol_setup', {
          count:
            moduleModel != null
              ? getOccludedSlotCountForModule(
                  getModuleType(moduleModel),
                  robotSideAnalysis.robotType ?? OT2_STANDARD_MODEL
                )
              : 1,
          labware: command.result?.definition.metadata.displayName,
          slot_name: getModuleDisplayLocation(
            robotSideAnalysis,
            command.params.location.moduleId
          ),
          module_name: moduleName,
        })
      } else if (
        command.params.location !== 'offDeck' &&
        'labwareId' in command.params.location
      ) {
        const labwareId = command.params.location.labwareId
        const labwareName = command.result?.definition.metadata.displayName
        const matchingAdapter = robotSideAnalysis.commands.find(
          (command): command is LoadAdapterRunTimeCommand =>
            command.result?.adapterId === labwareId
        )
        const adapterName =
          matchingAdapter?.result?.definition.metadata.displayName
        const adapterLoc = matchingAdapter?.params.location
        let adapterLocation: string | null = null
        if (adapterLoc === 'offDeck') {
          adapterLocation = 'offDeck'
          return t('load_labware_info_protocol_setup_adapter_off_deck', {
            labware: labwareName,
            adapter_name: adapterName,
          })
        } else if (adapterLoc != null && 'slotName' in adapterLoc) {
          adapterLocation = adapterLoc?.slotName
          return t('load_labware_info_protocol_setup_adapter', {
            labware: labwareName,
            adapter_name: adapterName,
            slot_name: adapterLocation,
          })
        } else {
          const moduleModel = getModuleModel(
            robotSideAnalysis,
            adapterLoc?.moduleId ?? ''
          )
          const moduleName =
            moduleModel != null ? getModuleDisplayName(moduleModel) : ''
          adapterLocation = getModuleDisplayLocation(
            robotSideAnalysis,
            adapterLoc?.moduleId ?? ''
          )
          return t('load_labware_info_protocol_setup_adapter_module', {
            labware: labwareName,
            adapter_name: adapterName,
            module_name: moduleName,
            slot_name: adapterLocation,
          })
        }
      } else {
        const labware = command.result?.definition.metadata.displayName
        return command.params.location === 'offDeck'
          ? t('load_labware_info_protocol_setup_off_deck', { labware })
          : t('load_labware_info_protocol_setup_no_module', {
              labware,
              slot_name: command.params.location?.slotName,
            })
      }
    }
    case 'loadLiquid': {
      const { liquidId, labwareId } = command.params
      return t('load_liquids_info_protocol_setup', {
        liquid: getLiquidDisplayName(robotSideAnalysis, liquidId),
        labware: getLabwareName(robotSideAnalysis, labwareId),
      })
    }
    default: {
      console.warn(
        'LoadCommandText encountered a command with an unrecognized commandType: ',
        command
      )
      return null
    }
  }
}
