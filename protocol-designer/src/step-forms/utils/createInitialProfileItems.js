// @flow
import { PROFILE_CYCLE, PROFILE_STEP } from '../../form-types'
import type { ProfileStepItem, ProfileCycleItem } from '../../form-types'

export const createInitialProfileStep = (id: string): ProfileStepItem => ({
  type: PROFILE_STEP,
  id,
  title: '',
  temperature: '',
  durationMinutes: '',
  durationSeconds: '',
})

export const createInitialProfileCycle = (
  cycleId: string,
  profileStepId: string
): ProfileCycleItem => ({
  id: cycleId,
  type: PROFILE_CYCLE,
  repetitions: '',
  steps: [createInitialProfileStep(profileStepId)],
})
