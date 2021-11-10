import type { Section } from '../types'
import { useSteps } from './useSteps'

export function useSections(): Section[] {
  const steps = useSteps()
  return steps.reduce<Section[]>(
    (acc, step) => (acc.includes(step.section) ? acc : [...acc, step.section]),
    []
  )
}
