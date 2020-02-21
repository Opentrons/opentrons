// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export type SectionContentHalfProps = {|
  children: React.Node,
  className?: string,
|}

export function SectionContentHalf(props: SectionContentHalfProps) {
  return (
    <div className={cx(styles.section_content_50, props.className)}>
      {props.children}
    </div>
  )
}
