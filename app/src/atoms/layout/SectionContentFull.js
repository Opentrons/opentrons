// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export type SectionContentFullProps = {|
  children: React.Node,
  className?: string,
|}

export function SectionContentFull(props: SectionContentFullProps): React.Node {
  return (
    <div className={cx(styles.section_content_full, props.className)}>
      {props.children}
    </div>
  )
}
