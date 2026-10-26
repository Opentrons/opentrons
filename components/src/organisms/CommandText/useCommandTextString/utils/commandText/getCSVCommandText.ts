import type {
  CreateCSVCommand,
  CSVWriteRowCommand,
} from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

const KEYS_BY_COMMAND_TYPE: {
  [commandType in RunTimeCommand['commandType']]?: string
} = {
  createCSV: 'create_csv',
  csvWriteRow: 'csv_write_row',
}

type HandledCommands = Extract<
  RunTimeCommand,
  { commandType: keyof typeof KEYS_BY_COMMAND_TYPE }
>

type GetCSVCommandText = HandlesCommands<HandledCommands>

export function getCSVCommandText({ command, t }: GetCSVCommandText): string {
  if (command.commandType === 'createCSV') {
    const filename =
      command.params.fileName != null ? command.params.fileName : 'unknown file'
    return t('create_csv', {
      filename,
    })
  }
  return t(KEYS_BY_COMMAND_TYPE[command.commandType])
}
