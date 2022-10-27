import type { DeprecatedSection } from '../types'
import { useDeprecatedSteps } from './useDeprecatedSteps'

export function useSections(runId: string | null): DeprecatedSection[] {
  const steps = useDeprecatedSteps(runId)
  return steps.reduce<DeprecatedSection[]>(
    (acc, step) => (acc.includes(step.section) ? acc : [...acc, step.section]),
    []
  )
}
