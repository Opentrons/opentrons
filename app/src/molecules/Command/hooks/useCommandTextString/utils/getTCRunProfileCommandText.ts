import type { TCRunProfileRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandTextResult } from '..'
import type { HandlesCommands } from './types'

export function getTCRunProfileCommandText({
  command,
  t,
}: HandlesCommands<TCRunProfileRunTimeCommand>): GetCommandTextResult {
  const { profile } = command.params

  const stepTexts = profile.map(
    ({ holdSeconds, celsius }: { holdSeconds: number; celsius: number }) =>
      t('tc_run_profile_steps', {
        celsius,
        seconds: holdSeconds,
      }).trim()
  )

  const startingProfileText = t('tc_starting_profile', {
    repetitions: Object.keys(stepTexts).length,
  })

  return { commandText: startingProfileText, stepTexts }
}
