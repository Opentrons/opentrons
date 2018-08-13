// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

type Props = {
  children: React.Node,
  className: string,
}
export default function CardContentQuarter (props: Props) {
  return (
    <div className={cx(styles.card_content_25, props.className)}>
      {props.children}
    </div>
  )
}
