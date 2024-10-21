import {
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  getPipetteSpecsV2,
} from '@opentrons/shared-data'

import { getPipetteNameOnMount } from './getPipetteNameOnMount'
import { getLiquidDisplayName } from './getLiquidDisplayName'

import { getLabwareName } from '/app/local-resources/labware'
import {
  getModuleModel,
  getModuleDisplayLocation,
} from '/app/local-resources/modules'

import type { LoadLabwareRunTimeCommand } from '@opentrons/shared-data'
import type { GetCommandText } from '..'

export const getLoadCommandText = ({
  command,
  commandTextData,
  robotType,
  t,
  allRunDefs,
}: GetCommandText): string => {
  switch (command?.commandType) {
    case 'loadPipette': {
      const pipetteModel =
        commandTextData != null
          ? getPipetteNameOnMount(
              commandTextData.pipettes,
              command.params.mount
            )
          : null
      return t('load_pipette_protocol_setup', {
        pipette_name:
          pipetteModel != null
            ? getPipetteSpecsV2(pipetteModel)?.displayName ?? ''
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
        const moduleModel =
          commandTextData != null
            ? getModuleModel(
                commandTextData.modules ?? [],
                command.params.location.moduleId
              )
            : null
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
          slot_name:
            commandTextData != null
              ? getModuleDisplayLocation(
                  commandTextData.modules ?? [],
                  command.params.location.moduleId
                )
              : null,
          module_name: moduleName,
        })
      } else if (
        command.params.location !== 'offDeck' &&
        'labwareId' in command.params.location
      ) {
        const labwareId = command.params.location.labwareId
        const labwareName = command.result?.definition.metadata.displayName
        const matchingAdapter = commandTextData?.commands.find(
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
          const moduleModel =
            commandTextData != null
              ? getModuleModel(
                  commandTextData.modules ?? [],
                  adapterLoc?.moduleId ?? ''
                )
              : null
          const moduleName =
            moduleModel != null ? getModuleDisplayName(moduleModel) : ''
          return t('load_labware_info_protocol_setup_adapter_module', {
            labware: labwareName,
            adapter_name: adapterName,
            module_name: moduleName,
            slot_name:
              commandTextData != null
                ? getModuleDisplayLocation(
                    commandTextData.modules ?? [],
                    adapterLoc?.moduleId ?? ''
                  )
                : null,
          })
        } else {
          //  shouldn't reach here, adapter shouldn't have location  type labwareId
          return ''
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
    case 'reloadLabware': {
      const { labwareId } = command.params
      const labware =
        commandTextData != null
          ? getLabwareName({
              loadedLabwares: commandTextData?.labware ?? [],
              labwareId,
              allRunDefs,
            })
          : null
      return t('reloading_labware', { labware })
    }
    case 'loadLiquid': {
      const { liquidId, labwareId } = command.params
      return t('load_liquids_info_protocol_setup', {
        liquid:
          commandTextData != null
            ? getLiquidDisplayName(commandTextData.liquids ?? [], liquidId)
            : null,
        labware:
          commandTextData != null
            ? getLabwareName({
                loadedLabwares: commandTextData?.labware ?? [],
                labwareId,
                allRunDefs,
              })
            : null,
      })
    }
    default: {
      console.warn(
        'LoadCommandText encountered a command with an unrecognized commandType: ',
        command
      )
      return ''
    }
  }
}
