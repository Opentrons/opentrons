// @flow
import cx from 'classnames'
import * as React from 'react'

import styles from './styles.css'

export type CardContentQuarterProps = {|
  children: React.Node,
  className?: string,
|}

export function CardContentQuarter(props: CardContentQuarterProps): React.Node {
  return (
    <div className={cx(styles.card_content_25, props.className)}>
      {props.children}
    </div>
  )
}
