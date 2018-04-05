// @flow
import * as React from 'react'
import cx from 'classnames'

import styles from './styles.css'

type Props = {
  className?: string,
  children?: React.Node,
}

export default function AbsoluteWrapper (props: Props) {
  return (
    <div className={cx(styles.absolute_wrapper, props.className)}>
      {props.children}
    </div>
  )
}
