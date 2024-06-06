import * as React from 'react'
import cx from 'classnames'
import styles from './styles.module.css'

export type LabelPosition = 'top' | 'left'

export const LABEL_TOP: LabelPosition = 'top'
export const LABEL_LEFT: LabelPosition = 'left'

export interface LabelTextProps {
  /** location of the label to its siblings; defaults to "top" */
  position?: LabelPosition
  /** contents of the label */
  children: React.ReactNode
}

/**
 * LabelText - all-caps text, usually used to label a <Value> or <Table>
 */
export function LabelText(props: LabelTextProps): JSX.Element {
  const { children } = props
  const position = props.position || LABEL_TOP
  const classes = cx(
    styles.label_text,
    position === LABEL_TOP ? styles.top : styles.left
  )

  return <p className={classes}>{children}</p>
}
