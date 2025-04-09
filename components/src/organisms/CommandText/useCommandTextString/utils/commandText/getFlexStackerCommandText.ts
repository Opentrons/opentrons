import type {
  FlexStackerSetStoredLabwareRunTimeCommand,
  FlexStackerStoreRunTimeCommand,
  FlexStackerRetrieveRunTimeCommand,
  FlexStackerFillRunTimeCommand,
  FlexStackerEmptyRunTimeCommand,
  RunTimeCommand,
  getAllLabwareDefs
} from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'
import { getLabwareDisplayLocation, type DisplayLocationParams } from '../../utils/getLabwareDisplayLocation'

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
    const location = {moduleId: command.params?.moduleId as string}
    const displayLocationParams: DisplayLocationParams = location
    const slotName = getLabwareDisplayLocation(displayLocationParams)
    console.log("slotName: ", slotName)
    if ('result' in command){
      const currentLabwareDef = getAllLabwareDefs()[command?.result.primaryLabwareURI]
      const primaryDefinitionUri = command.result.primaryLabwareURI
      console.log("labware def uri: ", command?.result.primaryLabwareURI)
      console.log('currentLabwareDef: ', currentLabwareDef)

      return (
        `Retrieve ${primaryDefinitionUri} from Flex Stacker to ${slotName}`
      )
    }
    else{
      return `Retrieve from Flex Stacker.`
    }  
  }
  return t(KEYS_BY_COMMAND_TYPE[command.commandType])
}
