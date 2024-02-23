import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { SidePanel } from '@opentrons/components'
import { selectors } from '../../navigation'
import { PDTitledList } from '../lists'
import styles from './SettingsPage.css'

export const SettingsSidebar = (): JSX.Element => {
  const currentPage = useSelector(selectors.getCurrentPage)
  const { t } = useTranslation('nav')
  return (
    <SidePanel title={t('tab_name.settings')}>
      <PDTitledList
        className={styles.sidebar_item}
        selected={currentPage === 'settings-app'}
        title={t('settings.app')}
      />
    </SidePanel>
  )
}
