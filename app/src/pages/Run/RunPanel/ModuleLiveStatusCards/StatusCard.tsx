// @flow
import * as React from 'react'
import styles from './styles.css'
import { CollapsibleItem } from '@opentrons/components'

type Props = {|
  /** Title for the card */
  title: string,
  /** Card Content, each child will be separated with a grey bottom border */
  children: ?React.Node,
  /** Optional className for card contents */
  className?: string,
  isCardExpanded: boolean,
  toggleCard: boolean => mixed,
|}

export function StatusCard(props: Props): React.Node {
  return (
    <CollapsibleItem
      className={styles.status_card}
      onCollapseToggle={() => props.toggleCard(!props.isCardExpanded)}
      title={props.title}
      collapsed={!props.isCardExpanded}
    >
      {props.children}
    </CollapsibleItem>
  )
}
