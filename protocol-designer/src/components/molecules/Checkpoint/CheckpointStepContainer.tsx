import { StepContainer } from '../StepContainer'
import spacingStyles from './commonspacing.module.css'

import type { ComponentProps } from 'react'

/**
 * A `StepContainer` nested within a `Checkpoint`.
 * This wrapper component provides `Checkpoint`-specific spacing.
 */
export function CheckpointStepContainer(
  props: ComponentProps<typeof StepContainer>
): JSX.Element {
  return (
    <div className={spacingStyles.step_container}>
      <StepContainer {...props} />
    </div>
  )
}
