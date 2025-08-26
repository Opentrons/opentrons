import type {
  ConcurrentRunTimeCommand,
  CreateTimerRunTimeCommand,
} from '@opentrons/shared-data/command'
import type { HandlesCommands } from '../types'

export function getCreateTimerCommandText({
  command,
  t,
}: HandlesCommands<CreateTimerRunTimeCommand>): string {
  const { time } = command.params
  return t('create_timer', { seconds: time })
}

export function getConcurrentCommandText(
  params: HandlesCommands<ConcurrentRunTimeCommand>
): string {
  const { command } = params
  switch (command.commandType) {
    case 'createTimer':
      return getCreateTimerCommandText(params)
  }
}
