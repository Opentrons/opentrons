import type { CommentArgs } from '@opentrons/step-generation'

import styles from './StepItem.module.css'

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
      <div className={styles.substep_header}>
        <span>Comment</span>
      </div>
      <div className={styles.substep_content}>{`"${message}"`}</div>
    </>
  )
}
