import { useTranslation } from 'react-i18next'
import {
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'
import {
  getLabwareName,
  getPipetteNameOnMount,
  getModuleModel,
  getModuleDisplayLocation,
  getLiquidDisplayName,
} from './utils'

import type {
  RunTimeCommand,
  RobotType,
  LoadLabwareRunTimeCommand,
} from '@opentrons/shared-data'
import type { CommandTextData } from './types'

interface LoadCommandTextProps {
  command: RunTimeCommand
  commandTextData: CommandTextData
  robotType: RobotType
}

export const LoadCommandText = ({
  command,
  commandTextData,
  robotType,
}: LoadCommandTextProps): JSX.Element | null => {
  const { t } = useTranslation('run_details')

  switch (command.commandType) {
    case 'loadPipette': {
      const pipetteModel = getPipetteNameOnMount(
        commandTextData,
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
        robotType
      )
      return t('load_module_protocol_setup', {
        count: occludedSlotCount,
        module: getModuleDisplayName(command.params.model),
        slot_name: command.params.location.slotName,
      })
    }
    case 'loadLabware': {
      if (
        command.params.location !== 'offDeck' &&
        'moduleId' in command.params.location
      ) {
        const moduleModel = getModuleModel(
          commandTextData,
          command.params.location.moduleId
        )
        const moduleName =
          moduleModel != null ? getModuleDisplayName(moduleModel) : ''

        return t('load_labware_info_protocol_setup', {
          count:
            moduleModel != null
              ? getOccludedSlotCountForModule(
                  getModuleType(moduleModel),
                  robotType
                )
              : 1,
          labware: command.result?.definition.metadata.displayName,
          slot_name: getModuleDisplayLocation(
            commandTextData,
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
        const matchingAdapter = commandTextData.commands.find(
          (command): command is LoadLabwareRunTimeCommand =>
            command.commandType === 'loadLabware' &&
            command.result?.labwareId === labwareId
        )
        const adapterName =
          matchingAdapter?.result?.definition.metadata.displayName
        const adapterLoc = matchingAdapter?.params.location
        if (adapterLoc === 'offDeck') {
          return t('load_labware_info_protocol_setup_adapter_off_deck', {
            labware: labwareName,
            adapter_name: adapterName,
          })
        } else if (adapterLoc != null && 'slotName' in adapterLoc) {
          return t('load_labware_info_protocol_setup_adapter', {
            labware: labwareName,
            adapter_name: adapterName,
            slot_name: adapterLoc?.slotName,
          })
        } else if (adapterLoc != null && 'moduleId' in adapterLoc) {
          const moduleModel = getModuleModel(
            commandTextData,
            adapterLoc?.moduleId ?? ''
          )
          const moduleName =
            moduleModel != null ? getModuleDisplayName(moduleModel) : ''
          return t('load_labware_info_protocol_setup_adapter_module', {
            labware: labwareName,
            adapter_name: adapterName,
            module_name: moduleName,
            slot_name: getModuleDisplayLocation(
              commandTextData,
              adapterLoc?.moduleId ?? ''
            ),
          })
        } else {
          //  shouldn't reach here, adapter shouldn't have location  type labwareId
          return null
        }
      } else {
        const labware =
          command.result?.definition.metadata.displayName ??
          command.params.displayName
        return command.params.location === 'offDeck'
          ? t('load_labware_info_protocol_setup_off_deck', { labware })
          : t('load_labware_info_protocol_setup_no_module', {
              labware,
              slot_name:
                'addressableAreaName' in command.params.location
                  ? command.params.location.addressableAreaName
                  : command.params.location.slotName,
            })
      }
    }
    case 'loadLiquid': {
      const { liquidId, labwareId } = command.params
      return t('load_liquids_info_protocol_setup', {
        liquid: getLiquidDisplayName(commandTextData, liquidId),
        labware: getLabwareName(commandTextData, labwareId),
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
