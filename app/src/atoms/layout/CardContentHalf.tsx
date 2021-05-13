// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export type CardContentHalfProps = {|
  children: React.Node,
  className?: string,
|}

export function CardContentHalf(props: CardContentHalfProps): React.Node {
  return (
    <div className={cx(styles.card_content_50, props.className)}>
      {props.children}
    </div>
  )
}
