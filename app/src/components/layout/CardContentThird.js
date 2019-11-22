// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

type Props = {
  children: React.Node,
  className?: string,
  overrideLast?: boolean,
}
export default function CardContentThird(props: Props) {
  return (
    <div
      className={cx(styles.card_content_third, props.className, {
        [styles.override_last]: props.overrideLast,
      })}
    >
      {props.children}
    </div>
  )
}
