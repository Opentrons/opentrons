import { getLabwareDefURI } from '@opentrons/shared-data'

import { getLabwareDisplayLocation } from '../../utils/getLabwareDisplayLocation'

import type {
  FlexStackerEmptyRunTimeCommand,
  FlexStackerFillRunTimeCommand,
  FlexStackerRetrieveRunTimeCommand,
  FlexStackerSetStoredLabwareRunTimeCommand,
  FlexStackerStoreRunTimeCommand,
  LabwareDefinition,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

export type FlexStackerCommand =
  | FlexStackerSetStoredLabwareRunTimeCommand
  | FlexStackerStoreRunTimeCommand
  | FlexStackerRetrieveRunTimeCommand
  | FlexStackerFillRunTimeCommand
  | FlexStackerEmptyRunTimeCommand

export const KEYS_BY_COMMAND_TYPE: {
  [commandType in FlexStackerCommand['commandType']]: string
} = {
  'flexStacker/retrieve': 'flex_stacker_retrieve',
  'flexStacker/store': 'flex_stacker_store',
  'flexStacker/setStoredLabware': 'flex_stacker_set_stored_labware',
  'flexStacker/empty': 'flex_stacker_empty',
  'flexStacker/fill': 'flex_stacker_fill',
}

type HandledCommands = Extract<
  RunTimeCommand,
  { commandType: keyof typeof KEYS_BY_COMMAND_TYPE }
>

type GetFlexStackerCommandText = HandlesCommands<HandledCommands>

const getLabwareDisplayName = (labwareUri: string, allRunDefs: any): string => {
  const currentLabwareDef = allRunDefs.find(
    (def: LabwareDefinition) => getLabwareDefURI(def) === labwareUri
  )
  return currentLabwareDef?.metadata.displayName ?? null
}

export const getFlexStackerCommandText = ({
  command,
  allRunDefs,
  commandTextData,
  t,
  robotType,
}: // stackerCommand,
GetFlexStackerCommandText): string => {
  const primaryDefinitionDisplayName =
    command.result !== undefined && 'primaryLabwareURI' in command?.result
      ? getLabwareDisplayName(
          command?.result.primaryLabwareURI,
          allRunDefs ?? []
        )
      : null
  if (command.commandType === 'flexStacker/retrieve') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: command.result?.primaryLocationSequence,
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    if (primaryDefinitionDisplayName != null && slotName != null) {
      return t('branded:retrieve_labware_from_stacker_to', {
        primaryDefinitionDisplayName,
        slotName,
      })
    }
  } else if (command.commandType === 'flexStacker/store') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: command.result?.primaryOriginLocationSequence ?? null,
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    if (primaryDefinitionDisplayName != null && slotName != null) {
      return t('branded:store_labware_from_slot_to_stacker', {
        primaryDefinitionDisplayName,
        slotName,
      })
    }
  } else if (command.commandType === 'flexStacker/setStoredLabware') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: { moduleId: command.params?.moduleId },
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    if (
      command.result !== undefined &&
      'primaryLabwareDefinition' in command.result &&
      slotName != null
    ) {
      return (
        t(
          'branded:flex_stacker_set_stored_labware_with_quantity_and_location',
          {
            quantity: command.params.initialCount,
            stackerColumn: slotName,
            labwareAndLidDisplayNames:
              command.result?.primaryLabwareDefinition.metadata.displayName,
          }
        ) +
        (command.result?.lidLabwareDefinition != null
          ? t('with_lid_name', {
              lidDisplayName:
                command.result?.lidLabwareDefinition.metadata.displayName,
            })
          : '')
      )
    }
  } else if (command.commandType === 'flexStacker/fill') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: { moduleId: command.params?.moduleId },
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    if (primaryDefinitionDisplayName != null) {
      return (
        t('branded:flex_stacker_fill_with_quantity_and_labware', {
          quantity: command.params.count,
          stackerColumn: slotName,
          labwareAndLidDisplayNames: primaryDefinitionDisplayName,
        }) +
        (command.result?.lidLabwareURI != null
          ? t('with_lid_name', {
              lidDisplayName: getLabwareDisplayName(
                command.result?.lidLabwareURI,
                allRunDefs ?? []
              ),
            })
          : '')
      )
    }
  } else if (command.commandType === 'flexStacker/empty') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: { moduleId: command.params?.moduleId },
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    if (primaryDefinitionDisplayName != null && slotName != null) {
      return t('branded:flex_stacker_empty_from_location', {
        stackerColumn: slotName,
      })
    }
  }
  return t('branded:' + KEYS_BY_COMMAND_TYPE[command.commandType])
}
