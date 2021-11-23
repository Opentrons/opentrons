import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './styles.css'
import { CollapsibleItem, IconName } from '@opentrons/components'

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

const iconNameByModuleType: Record<string, IconName> = {
  temperatureModuleType: 'ot-temperature',
  magneticModuleType: 'ot-magnet',
  thermocyclerModuleType: 'ot-thermocycler',
}

export function StatusCard(props: Props): JSX.Element {
  const { t } = useTranslation('run_details')

  return (
    <CollapsibleItem
      iconName={iconNameByModuleType[props.moduleType]}
      className={styles.status_card}
      onCollapseToggle={props.toggleCard}
      header={
        props.header && t('module_slot_number', { slot_number: props.header })
      }
      title={props.title}
      collapsed={!props.isCardExpanded}
    >
      {props.children}
    </CollapsibleItem>
  )
}
