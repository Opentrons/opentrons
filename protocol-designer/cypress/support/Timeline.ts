// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { StepThunk } from './StepBuilder'

const step = '[data-testid^="StepContainer"]'
const stepButton = `${step} button`

export const TimelineSteps = {
  /**
   * Given a step like "1. Thermocycler",
   * 1 is the stepNumber and "Thermocycler" is the title.
   */
  SelectItemMenuOption: (
    stepNumber: number | null,
    title: string,
    option: 'Edit step' | 'Delete step' | 'Duplicate step'
  ): StepThunk => ({
    call: () => {
      cy.get(`[role="button"]`)
        .filter(`:contains("${stepNumber ?? ''}")`)
        .filter(`:contains("${title}")`)
        .as('timelineItem')
      cy.get('@timelineItem').click()
      cy.get('@timelineItem').find(stepButton).click()
      cy.contains(option).click()
    },
  }),
}
