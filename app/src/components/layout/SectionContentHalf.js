// @flow
import cx from 'classnames'
import * as React from 'react'

import styles from './styles.css'

export type SectionContentHalfProps = {|
  children: React.Node,
  className?: string,
|}

export function SectionContentHalf(props: SectionContentHalfProps): React.Node {
  return (
    <div className={cx(styles.section_content_50, props.className)}>
      {props.children}
    </div>
  )
}
