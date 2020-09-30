// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export type CardContentFullProps = {|
  children: React.Node,
  className?: string,
|}

export function CardContentFull(props: CardContentFullProps): React.Node {
  return (
    <div className={cx(styles.card_content_full, props.className)}>
      {props.children}
    </div>
  )
}
