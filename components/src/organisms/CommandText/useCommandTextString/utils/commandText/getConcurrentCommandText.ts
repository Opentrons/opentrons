import type { ConcurrentRunTimeCommand } from '@opentrons/shared-data/command'
import type { HandlesCommands } from '../types'

export function getConcurrentCommandText({
  command,
  t,
}: HandlesCommands<ConcurrentRunTimeCommand>): string {
  switch (command.commandType) {
    case 'createTimer':
      const { time } = command.params
      return t('create_timer', { seconds: time })
    case 'waitForTasks':
      return t('wait_for_tasks')
  }
}
