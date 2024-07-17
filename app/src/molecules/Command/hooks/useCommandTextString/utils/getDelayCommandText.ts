import type { DeprecatedDelayRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetDelayCommandText = Omit<GetCommandText, 'command'> & {
  command: DeprecatedDelayRunTimeCommand
}

export function getDelayCommandText({
  command,
  t,
}: GetDelayCommandText): string {
  const { message = '' } = command.params

  if ('waitForResume' in command.params) {
    return command.params?.message != null && command.params.message !== ''
      ? command.params.message
      : t('wait_for_resume')
  } else {
    return t('wait_for_duration', {
      seconds: command.params.seconds,
      message,
    })
  }
}
