import type {
  FlexStackerSetStoredLabwareRunTimeCommand,
  FlexStackerStoreRunTimeCommand,
  FlexStackerRetrieveRunTimeCommand,
  FlexStackerFillRunTimeCommand,
  FlexStackerEmptyRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'
import {getAllLabwareDefs} from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'
import { getLabwareDisplayLocation, type DisplayLocationParams, DisplayLocationSlotOnlyParams } from '../../utils/getLabwareDisplayLocation'

export type FlexStackerCommand =
  | FlexStackerSetStoredLabwareRunTimeCommand
  | FlexStackerStoreRunTimeCommand
  | FlexStackerRetrieveRunTimeCommand
  | FlexStackerFillRunTimeCommand
  | FlexStackerEmptyRunTimeCommand

const KEYS_BY_COMMAND_TYPE: {
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
  console.log('commandTextData:', commandTextData)
  console.log('allRunDefs: ', allRunDefs)
  console.log('command: ', command)
  let primaryDefinitionDisplayName = null
  if ('result' in command){
    const currentLabwareDef = getAllLabwareDefs()[command.result?.primaryLabwareURI]
    primaryDefinitionDisplayName = currentLabwareDef.metadata.displayName
  }

  if (command.commandType === 'flexStacker/retrieve') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: {moduleId: command.params?.moduleId as string},
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    console.log("slotName: ", slotName)
    if (primaryDefinitionDisplayName != null && slotName != null){
      // add logic for lid etc
      
      return t('retrieve_labware_from_stacker_to', {primaryDefinitionDisplayName, slotName})
    }
  }
  else if (command.commandType === 'flexStacker/store') {
    // get origin slot name
      const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: {moduleId: command.params?.moduleId as string},
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    console.log("slotName: ", slotName)
    if (primaryDefinitionDisplayName != null && slotName != null){
      // add logic for lid etc
      
      return t('store_labware_from_slot_to_stacker', {primaryDefinitionDisplayName, slotName})
    }
  }
  return t(KEYS_BY_COMMAND_TYPE[command.commandType])
}
