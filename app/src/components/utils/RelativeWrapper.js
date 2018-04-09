// @flow
import * as React from 'react'
import cx from 'classnames'

import styles from './styles.css'

type Props = {
  className?: string,
  children?: React.Node,
}

export default function RelativeWrapper (props: Props) {
  console.log(styles)

  return (
    <div className={cx(styles.relative_wrapper, props.className)}>
      {props.children}
    </div>
  )
}
