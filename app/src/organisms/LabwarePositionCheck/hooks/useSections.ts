import type { DeprecatedSection } from '../types'
import { useDeprecatedSteps } from './useDeprecatedSteps'

export function useSections(runId: string | null): Section[] {
  const steps = useDeprecatedSteps(runId)
  return steps.reduce<Section[]>(
    (acc, step) => (acc.includes(step.section) ? acc : [...acc, step.section]),
    []
  )
}
