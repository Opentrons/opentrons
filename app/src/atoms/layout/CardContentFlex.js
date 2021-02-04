// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export type CardContentFlexProps = {|
  children: React.Node,
  className?: string,
|}

export function CardContentFlex(props: CardContentFlexProps): React.Node {
  return (
    <div className={cx(styles.card_content_flex, props.className)}>
      {props.children}
    </div>
  )
}
