import * as React from 'react'
import styles from './StepItem.module.css'
import type { CommentArgs } from '@opentrons/step-generation'
interface CommentStepItemProps {
  commentArgs: CommentArgs
}

export function CommentStepItems(
  props: CommentStepItemProps
): JSX.Element | null {
  const { commentArgs } = props
  const message = commentArgs.message

  return (
    <>
      <li className={styles.substep_header}>
        <span>Comment</span>
      </li>
      <li className={styles.substep_content}>&quot;{message}&quot;</li>
    </>
  )
}
