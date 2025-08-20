import { clsx } from 'clsx'

import styles from './checkpoint.module.css'

import type { PropsWithChildren } from 'react'

interface Props {
  /** Whether this `Checkpoint` is part of the active step in the timeline. */
  active: boolean
}

/**
 * A level of indentation in the timeline, containing steps to run concurrently
 * with a "parent step."
 *
 * This should be rendered directly after the parent step, as a sibling to it.
 *
 * Each child may be:
 *
 * - A `CheckpointChip`.
 * - A `CheckpointStepContainer`.
 * - A drag-and-drop indicator.
 */
export function Checkpoint(props: PropsWithChildren<Props>): JSX.Element {
  const { active, children } = props
  return (
    <div className={clsx(styles.container, { [styles.active]: active })}>
      <div className={styles.ornamental_line} />
      <ul className={styles.checkpoint_list}>{children}</ul>
    </div>
  )
}
