import * as React from 'react'
import styles from './styles.css'
import { CollapsibleItem, IconName } from '@opentrons/components'
import { useFeatureFlag } from '../../../../redux/config'

interface Props {
  /** The type of module */
  moduleType?: string | any
  /** Slot number the module is in */
  header?: string
  /** Title for the card */
  title: string
  /** Card Content, each child will be separated with a grey bottom border */
  children?: React.ReactNode
  /** Optional className for card contents */
  className?: string
  isCardExpanded: boolean
  toggleCard: () => unknown
}

const StatusCardIcons: Record<string, IconName> = {
  temperatureModuleType: 'ot-temperature',
  magneticModuleType: 'ot-magnet',
  thermocyclerModuleType: 'ot-thermocycler',
}

export function StatusCard(props: Props): JSX.Element {
  const isNewProtocolRunPanel = useFeatureFlag('preProtocolFlowWithoutRPC')

  return isNewProtocolRunPanel ? (
    <CollapsibleItem
      iconName={StatusCardIcons[props.moduleType]}
      className={styles.status_card}
      onCollapseToggle={props.toggleCard}
      header={props.header && `Slot ${props.header}`}
      title={props.title}
      collapsed={!props.isCardExpanded}
    >
      {props.children}
    </CollapsibleItem>
  ) : (
    <CollapsibleItem
      className={styles.status_card}
      onCollapseToggle={props.toggleCard}
      header={props.header && `Slot ${props.header}`}
      title={props.title}
      collapsed={!props.isCardExpanded}
    >
      {props.children}
    </CollapsibleItem>
  )
}
