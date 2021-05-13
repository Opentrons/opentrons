// @flow
import * as React from 'react'

import styles from './styles.css'

export type CardCopyProps = {|
  children: React.Node,
|}

export function CardCopy(props: CardCopyProps): React.Node {
  return <p className={styles.card_copy}>{props.children}</p>
}
