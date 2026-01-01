import { formatDurationLabeled } from '../formatDuration'

import type {
  AtomicProfileStep,
  TCProfileCycle,
  TCStartRunExtendedProfileRunTimeCommand,
} from '@opentrons/shared-data/command'
import type {
  GetTCStartRunExtendedProfileCommandTextResult,
  TCProfileCycleText,
  TCProfileStepText,
} from '../..'
import type { HandlesCommands } from '../types'

export function getTCStartRunExtendedProfileCommandText({
  command,
  t,
}: HandlesCommands<TCStartRunExtendedProfileRunTimeCommand>): GetTCStartRunExtendedProfileCommandTextResult {
  const { profileElements } = command.params

  const stepText = ({
    celsius,
    holdSeconds,
  }: AtomicProfileStep): TCProfileStepText => ({
    kind: 'step',
    stepText: t('tc_run_profile_steps', {
      celsius,
      duration: formatDurationLabeled({ seconds: holdSeconds }),
    }).trim(),
  })

  const stepTexts = (cycle: AtomicProfileStep[]): TCProfileStepText[] =>
    cycle.map(stepText)

  const startingCycleText = (cycle: TCProfileCycle): string =>
    t('tc_starting_extended_profile_cycle', {
      repetitions: cycle.repetitions,
    })

  const cycleText = (cycle: TCProfileCycle): TCProfileCycleText => ({
    kind: 'cycle',
    cycleText: startingCycleText(cycle),
    stepTexts: stepTexts(cycle.steps),
  })
  const profileElementTexts = (
    profile: Array<TCProfileCycle | AtomicProfileStep>
  ): Array<TCProfileStepText | TCProfileCycleText> =>
    profile.map(element =>
      Object.hasOwn(element, 'repetitions')
        ? cycleText(element as TCProfileCycle)
        : stepText(element as AtomicProfileStep)
    )

  return {
    kind: 'thermocycler/startRunExtendedProfile',
    commandText: t('tc_starting_extended_profile_in_background', {
      elementCount: profileElements.length,
    }),
    profileElementTexts: profileElementTexts(profileElements),
  }
}
