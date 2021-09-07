import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export interface SectionContentFullProps {
  children: React.ReactNode
  className?: string
}

export function SectionContentFull(
  props: SectionContentFullProps
): JSX.Element {
  return (
    <div className={cx(styles.section_content_full, props.className)}>
      {props.children}
    </div>
  )
}
