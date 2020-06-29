// @flow
import type { ProfileCycleItem, ProfileStepItem } from '../../form-types'
import { PROFILE_CYCLE, PROFILE_STEP } from '../../form-types'

export const createInitialProfileCycle = (id: string): ProfileCycleItem => ({
  id,
  type: PROFILE_CYCLE,
  repetitions: '',
  steps: [],
})

export const createInitialProfileStep = (id: string): ProfileStepItem => ({
  type: PROFILE_STEP,
  id,
  title: '',
  temperature: '',
  durationMinutes: '',
  durationSeconds: '',
})
