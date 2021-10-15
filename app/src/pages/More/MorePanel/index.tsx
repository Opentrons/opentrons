import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { SidePanel, ListItem, Icon } from '@opentrons/components'

import { MORE } from '../../../redux/nav'
import styles from './styles.css'

export function MorePanel(): JSX.Element {
  const { t } = useTranslation('more_panel')

  const ITEMS = [
    { label: t('app'), url: '/more/app' },
    { label: t('custom_labware'), url: '/more/custom-labware' },
    { label: t('network_and_system'), url: '/more/network-and-system' },
    { label: t('resources'), url: '/more/resources' },
  ]

  return (
    <SidePanel title={MORE}>
      <div className={styles.menu_panel}>
        <ol className={styles.menu_list}>
          {ITEMS.map(item => (
            <ListItem
              key={item.url}
              url={item.url}
              className={styles.menu_item}
              activeClassName={styles.active}
            >
              <span>{item.label}</span>
              <Icon name="chevron-right" className={styles.menu_icon} />
            </ListItem>
          ))}
        </ol>
      </div>
    </SidePanel>
  )
}
