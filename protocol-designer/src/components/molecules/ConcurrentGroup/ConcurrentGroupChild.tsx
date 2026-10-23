import clsx from 'clsx'

import styles from './concurrentgroupchild.module.css'

import type { PropsWithChildren, ReactNode } from 'react'

interface ConcurrentGroupChildProps {
  type: 'step' | 'checkpoint'
}

/**
 * This wrapper component implements spacing between child elements of a
 * `<ConcurrentGroup>`.
 *
 * Example:
 *
 * ```
 * <ConcurrentGroup>
 *   <ConcurrentGroupChild type="checkpoint">
 *     <ConcurrentGroupCheckpoint />
 *   </ConcurrentGroupChild>
 *   <ConcurrentGroupChild type="step">
 *     <StepContainer />
 *   </ConcurrentGroupChild>
 * </ConcurrentGroup>
 * ```
 */
export function ConcurrentGroupChild(
  props: PropsWithChildren<ConcurrentGroupChildProps>
): ReactNode {
  const { type, children } = props
  return (
    <li
      className={clsx(
        type === 'step' && styles.step_container_spacing,
        type === 'checkpoint' && styles.checkpoint_spacing,
        styles.no_li_bullet
      )}
    >
      {children}
    </li>
  )
}
