import clsx from 'clsx'

import { StepContainer } from '../StepContainer'
import styles from './childrencommon.module.css'

import type { ComponentProps } from 'react'

/**
 * A `StepContainer` to nest within a `ConcurrentGroup`.
 * This wrapper component provides `ConcurrentGroup`-specific spacing.
 */
export function ConcurrentGroupStepContainer(
  props: ComponentProps<typeof StepContainer>
): JSX.Element {
  return (
    <li className={clsx(styles.step_container_spacing, styles.no_li_bullet)}>
      <StepContainer {...props} />
    </li>
  )
}
