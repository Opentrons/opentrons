import type { DeprecatedSection } from '../types'
import { useDeprecatedSteps } from './useDeprecatedSteps'
import { useSections } from './useSections'

type LabwareIdsBySection = {
  [section in Section]?: string[]
}
export function useLabwareIdsBySection(
  runId: string | null
): LabwareIdsBySection {
  const steps = useDeprecatedSteps(runId)
  const sections = useSections(runId)
  return sections.reduce<LabwareIdsBySection>(
    (labwareIdsBySection, section) => {
      return {
        ...labwareIdsBySection,
        [section]: steps.reduce<string[]>(
          (labwareIds, step) =>
            step.section === section
              ? [...labwareIds, step.labwareId]
              : labwareIds,
          []
        ),
      }
    },
    {}
  )
}
