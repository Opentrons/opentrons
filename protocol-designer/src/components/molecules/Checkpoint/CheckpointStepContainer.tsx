import clsx from 'clsx'

import { StepContainer } from '../StepContainer'
import styles from './childrencommon.module.css'

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
    <li className={clsx(styles.step_container_spacing, styles.no_li_bullet)}>
      <StepContainer {...props} />
    </li>
  )
}
