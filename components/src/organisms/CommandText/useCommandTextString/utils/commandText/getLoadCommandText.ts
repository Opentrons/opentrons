import find from 'lodash/find'

import {
  getAllLiquidClassDefs,
  getModuleDeckLabel,
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  getPipetteSpecsV2,
  locationIsOffDeck,
  locationIsOnLabware,
} from '@opentrons/shared-data'

import { getLabwareDisplayLocation } from '../getLabwareDisplayLocation'
import { getLabwareName } from '../getLabwareName'
import { getLiquidDisplayName } from '../getLiquidDisplayName'
import { getPipetteNameOnMount } from '../getPipetteNameOnMount'

import type { GetCommandText } from '../..'

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
            ? (getPipetteSpecsV2(pipetteModel)?.displayName ?? '')
            : '',
        mount_name:
          command.params.mount === 'left' ? t('left_mount') : t('right_mount'),
      })
    }
    case 'loadModule': {
      const moduleType = getModuleType(command.params.model)
      const occludedSlotCount = getOccludedSlotCountForModule(
        moduleType,
        robotType
      )
      return t('load_module_protocol_setup', {
        count: occludedSlotCount,
        module: getModuleDisplayName(command.params.model),
        slot_name: getModuleDeckLabel(
          moduleType,
          command.params.location.slotName
        ),
      })
    }
    case 'loadLid':
    case 'loadLabware': {
      const location = getLabwareDisplayLocation({
        location: command.result?.locationSequence ?? command.params.location,
        robotType,
        allRunDefs,
        loadedLabwares: commandTextData?.labware ?? [],
        loadedModules: commandTextData?.modules ?? [],
        t,
      })
      const labwareName =
        'displayName' in command.params && command.params.displayName != null
          ? command.params.displayName
          : command.result?.definition.metadata.displayName

      // use in preposition for modules and slots, on for labware and adapters
      let displayLocation = t('in_location', { location })
      if (locationIsOffDeck(command.params.location)) {
        displayLocation = location
      } else if ('labwareId' in command.params.location) {
        displayLocation = t('on_location', { location })
      }

      return t('load_labware_to_display_location', {
        labware: labwareName,
        display_location: displayLocation,
      })
    }
    case 'loadLidStack': {
      // this will be the case if the system creates an empty stack to move lids onto
      if (command.result?.definition == null) {
        return t('load_lid_stack_empty')
      }
      const location =
        command.result?.stackLocationSequence != null
          ? getLabwareDisplayLocation({
              location: command.result.stackLocationSequence,
              robotType,
              allRunDefs,
              loadedLabwares: commandTextData?.labware ?? [],
              loadedModules: commandTextData?.modules ?? [],
              t,
            })
          : ''
      // use in preposition for modules and slots, on for labware and adapters
      let displayLocation = t('in_location', { location })
      if (locationIsOnLabware(command.params.location)) {
        displayLocation = t('on_location', { location })
      }
      const lidName = command.result.definition.metadata.displayName
      const quantity = command.params.quantity
      return t('load_lid_stack', {
        quantity,
        labware: lidName,
        display_location: displayLocation,
      })
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
      const displayName = getLiquidDisplayName(
        commandTextData?.liquids ?? [],
        liquidId,
        t
      )

      return t('load_liquids_info_protocol_setup', {
        liquid: displayName,
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
    case 'loadLiquidClass': {
      const { liquidClassName } = command.params.liquidClassRecord
      const liquidClassDisplayName = find(
        getAllLiquidClassDefs(),
        liquidClassDef => liquidClassDef.liquidClassName === liquidClassName
      )?.displayName
      return t('load_liquid_class', {
        liquidClassDisplayName,
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
