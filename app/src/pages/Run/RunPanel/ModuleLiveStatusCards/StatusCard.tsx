import * as React from 'react'
import styles from './styles.css'
import { CollapsibleItem } from '@opentrons/components'

interface Props {
  /** Slot number the module is in */
  header: string
  /** Title for the card */
  title: string
  /** Card Content, each child will be separated with a grey bottom border */
  children?: React.ReactNode
  /** Optional className for card contents */
  className?: string
  isCardExpanded: boolean
  toggleCard: () => unknown
}

export function StatusCard(props: Props): JSX.Element {
  return (
    <CollapsibleItem
      className={styles.status_card}
      onCollapseToggle={props.toggleCard}
      header={`Slot ${props.header}`}
      title={props.title}
      collapsed={!props.isCardExpanded}
    >
      {props.children}
    </CollapsibleItem>
  )
}
