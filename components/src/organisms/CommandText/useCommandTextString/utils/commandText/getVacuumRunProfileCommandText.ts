import { formatDurationLabeled } from '../formatDuration'

import type {
  AtomicVacuumProfileStep,
  VacuumModuleStartRunProfileRunTimeCommand,
  VacuumProfileCycle,
} from '@opentrons/shared-data/command'
import type { GetVacuumRunProfileCommandTextResult } from '../..'
import type { HandlesCommands } from '../types'

export interface VacuumProfileStepText {
  kind: 'step'
  stepText: string
}

export interface VacuumProfileCycleText {
  kind: 'cycle'
  cycleText: string
  stepTexts: VacuumProfileStepText[]
}

export function getVacuumRunProfileCommandText({
  command,
  t,
}: HandlesCommands<VacuumModuleStartRunProfileRunTimeCommand>): GetVacuumRunProfileCommandTextResult {
  const { steps } = command.params

  if (steps == null) {
    return {
      kind: 'vacuumModule/startRunProfile',
      commandText: t('running_vacuum_module_profile_generic'),
      profileElementTexts: [],
    }
  }

  const stepText = (step: AtomicVacuumProfileStep): VacuumProfileStepText => ({
    kind: 'step',
    stepText: ('gaugePressureMbar' in step
      ? t('vacuum_run_profile_pressure_step', {
          pressure: step.gaugePressureMbar,
          duration: formatDurationLabeled({ seconds: step.holdSeconds }),
        })
      : t('vacuum_run_profile_power_step', {
          power: step.percentPower,
          duration: formatDurationLabeled({ seconds: step.holdSeconds }),
        })
    ).trim(),
  })

  const cycleText = (cycle: VacuumProfileCycle): VacuumProfileCycleText => ({
    kind: 'cycle',
    cycleText: t('vacuum_run_profile_cycle', {
      repetitions: cycle.repetitions,
    }),
    stepTexts: cycle.steps.map(stepText),
  })

  const profileElementTexts = steps.map(element =>
    'repetitions' in element
      ? cycleText(element as VacuumProfileCycle)
      : stepText(element as AtomicVacuumProfileStep)
  )

  return {
    kind: 'vacuumModule/startRunProfile',
    commandText: t('running_vacuum_module_profile', {
      elementCount: steps.length,
    }),
    profileElementTexts,
  }
}
