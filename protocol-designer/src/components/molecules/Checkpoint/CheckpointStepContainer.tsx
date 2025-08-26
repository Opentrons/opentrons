import { StepContainer } from '../StepContainer'
import spacingStyles from './commonspacing.module.css'

import type { ComponentProps } from 'react'

// todo(mm, 2025-08-26): Revisit the names of Checkpoint/CheckpointChip/CheckpointStepContainer,
// pending discussion with the design team.

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
