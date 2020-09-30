// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export type CardContentThirdProps = {|
  children: React.Node,
  className?: string,
|}

export function CardContentThird(props: CardContentThirdProps): React.Node {
  return (
    <div className={cx(styles.card_content_third, props.className)}>
      {props.children}
    </div>
  )
}
