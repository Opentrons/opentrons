import { CreateCommand } from '@opentrons/shared-data'
import { CreateRunCommand } from '../types'

export const chainRunCommands = (
  commands: CreateCommand[],
  createRunCommand: CreateRunCommand,
  onAllSuccess: (response: any) => void = () => {}
): void => {
  if (commands.length < 1) return
  createRunCommand(
    {
      command: commands[0],
      waitUntilComplete: true,
    },
    {
      onSuccess: response => {
        if (commands.slice(1).length < 1) {
          onAllSuccess(response)
        } else {
          chainRunCommands(commands.slice(1), createRunCommand, onAllSuccess)
        }
      },
    }
  )
}
