import type { HandlesCommands } from '../types'
import type {
  FlexStackerEmptyRunTimeCommand,
  FlexStackerFillRunTimeCommand,
  FlexStackerRetrieveRunTimeCommand,
  FlexStackerSetStoredLabwareRunTimeCommand,
  FlexStackerStoreRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'

export type FlexStackerCommand =
  | FlexStackerSetStoredLabwareRunTimeCommand
  | FlexStackerStoreRunTimeCommand
  | FlexStackerRetrieveRunTimeCommand
  | FlexStackerFillRunTimeCommand
  | FlexStackerEmptyRunTimeCommand

type HandledCommands = Extract<
  RunTimeCommand,
  { commandType: FlexStackerCommand }
>

type GetFlexStackerCommandText = HandlesCommands<HandledCommands>

// hold until Casey's work is implemented?
export const getFlexStackerCommandText = ({
  command,
  t,
}: // stackerCommand,
GetFlexStackerCommandText): string => {
  return ''
}
