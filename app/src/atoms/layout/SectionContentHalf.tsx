import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export interface SectionContentHalfProps {
  children: React.ReactNode
  className?: string
}

export function SectionContentHalf(
  props: SectionContentHalfProps
): JSX.Element {
  return (
    <div className={cx(styles.section_content_50, props.className)}>
      {props.children}
    </div>
  )
}
