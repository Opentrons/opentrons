import type {
  FlexStackerSetStoredLabwareRunTimeCommand,
  FlexStackerStoreRunTimeCommand,
  FlexStackerRetrieveRunTimeCommand,
  FlexStackerFillRunTimeCommand,
  FlexStackerEmptyRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'
import { getAllLabwareDefs } from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'
import { getLabwareDisplayLocation } from '../../utils/getLabwareDisplayLocation'

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

export const getFlexStackerCommandText = ({
  command,
  allRunDefs,
  commandTextData,
  t,
  robotType,
}: // stackerCommand,
GetFlexStackerCommandText): string => {
  let primaryDefinitionDisplayName = null
  if ('result' in command && 'primaryLabwareURI' in command.result) {
    const currentLabwareDef = getAllLabwareDefs()[
      command.result?.primaryLabwareURI
    ]
    primaryDefinitionDisplayName =
      currentLabwareDef?.metadata.displayName ?? null
  }

  if (command.commandType === 'flexStacker/retrieve') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: { moduleId: command.params?.moduleId as string },
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    if (primaryDefinitionDisplayName != null && slotName != null) {
      return t('retrieve_labware_from_stacker_to', {
        primaryDefinitionDisplayName,
        slotName,
      })
    }
  } else if (command.commandType === 'flexStacker/store') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: command.result?.primaryOriginLocationSequence[0] ?? null,
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    if (primaryDefinitionDisplayName != null && slotName != null) {
      return t('store_labware_from_slot_to_stacker', {
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
    if ('primaryLabwareDefinition' in command?.result && slotName != null) {
      return (
        t('flex_stacker_set_stored_labware_with_quantity_and_location', {
          quantity: command.params.initialCount,
          slotName,
          primaryDefinitionDisplayName:
            command.result?.primaryLabwareDefinition.metadata.displayName,
        }) +
        (command.result?.lidLabwareURI != null
          ? t('with_lid_name', {
              lidDisplayName: command.result?.lidLabwareURI,
            })
          : '')
      )
    }
  } else if (command.commandType === 'flexStacker/fill') {
    if (primaryDefinitionDisplayName != null) {
      return (
        t('flex_stacker_fill_with_quantity_and_labware', {
          quantity: command.params.count,
          primaryDefinitionDisplayName,
        }) +
        (command.result?.lidLabwareURI != null
          ? t('with_lid_name', {
              lidDisplayName: command.result?.lidLabwareURI,
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
      return t('flex_stacker_empty_from_location', {
        slotName,
      })
    }
  }
  return t(KEYS_BY_COMMAND_TYPE[command.commandType])
}
