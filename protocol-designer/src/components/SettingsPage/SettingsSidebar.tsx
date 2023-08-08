import * as React from 'react'
import { SidePanel } from '@opentrons/components'
import { connect } from 'react-redux'

import { BaseState, ThunkDispatch } from '../../types'
import { actions, selectors, Page } from '../../navigation'
import { i18n } from '../../localization'
import { PDTitledList } from '../lists'
import styles from './SettingsPage.css'

interface SP {
  currentPage: Page
}
interface DP {
  makeNavigateToPage: (page: Page) => () => unknown
}
type Props = SP & DP

const SettingsSidebarComponent = (props: Props): JSX.Element => (
  <SidePanel title={i18n.t('nav.tab_name.settings')}>
    <PDTitledList
      className={styles.sidebar_item}
      selected={props.currentPage === 'settings-app'}
      title={i18n.t('nav.settings.app')}
    />
    {/* <PDTitledList
      className={styles.sidebar_item}
      onClick={props.makeNavigateToPage('settings-features')}
      selected={props.currentPage === 'settings-features'}
      title={i18n.t('nav.settings.feature_flags')}/> */}
  </SidePanel>
)

const STP = (state: BaseState): SP => ({
  currentPage: selectors.getCurrentPage(state),
})

const DTP = (dispatch: ThunkDispatch<any>): DP => ({
  makeNavigateToPage: (pageName: Page) => () =>
    dispatch(actions.navigateToPage(pageName)),
})

export const SettingsSidebar = connect(STP, DTP)(SettingsSidebarComponent)
