import type {
  FlexStackerSetStoredLabwareRunTimeCommand,
  FlexStackerStoreRunTimeCommand,
  FlexStackerRetrieveRunTimeCommand,
  FlexStackerFillRunTimeCommand,
  FlexStackerEmptyRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

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
  'flexStacker/fill': 'flex_stacker_set_stored_labware',
}

type HandledCommands = Extract<
  RunTimeCommand,
  { commandType: FlexStackerCommand }
>

type GetFlexStackerCommandText = HandlesCommands<HandledCommands>

// hold until Casey's work is implemented?
export const getFlexStackerCommandText = ({
  command,
  allRunDefs,
  commandTextData,
  t,
}: // stackerCommand,
GetFlexStackerCommandText): string => {
  console.log('commandTextData:', commandTextData)
  console.log('allRunDefs: ', allRunDefs)
  console.log('command: ', command)
  if (command.commandType === 'flexStacker/retrieve') {
    return (
      'flexStacker/retrieve' +
      'Retrieve {command.result.primaryLabwareURI} from Flex Stacker to slotLocation'
    )
  }
  return t(KEYS_BY_COMMAND_TYPE[command.commandType])
}
