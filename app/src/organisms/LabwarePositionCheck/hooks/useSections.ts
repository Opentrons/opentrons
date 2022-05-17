import type { Section } from '../types'
import { useSteps } from './useSteps'

export function useSections(runId: string | null): Section[] {
  const steps = useSteps(runId)
  return steps.reduce<Section[]>(
    (acc, step) => (acc.includes(step.section) ? acc : [...acc, step.section]),
    []
  )
}
