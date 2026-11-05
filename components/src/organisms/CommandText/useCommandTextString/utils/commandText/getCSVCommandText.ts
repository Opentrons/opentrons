import type {
  CreateCSVRuntimeCommand,
  CSVWriteRowRuntimeCommand,
} from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

type HandledCommands = CreateCSVRuntimeCommand | CSVWriteRowRuntimeCommand

type GetCSVCommandText = HandlesCommands<HandledCommands>

export function getCSVCommandText({ command, t }: GetCSVCommandText): string {
  if (command.commandType === 'createCSV') {
    const filename =
      command.params.fileName != null ? command.params.fileName : 'unknown file'
    return t('create_csv', {
      filename,
    })
  } else {
    return t('csv_write_row')
  }
}
