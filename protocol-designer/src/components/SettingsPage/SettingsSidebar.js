// @flow
import * as React from 'react'
import { SidePanel } from '@opentrons/components'
import { connect } from 'react-redux'

import type { BaseState, ThunkDispatch } from '../../types'
import { actions, selectors, type Page } from '../../navigation'
import i18n from '../../localization'
import { PDTitledList } from '../lists'
import styles from './SettingsPage.css'

type SP = {| currentPage: Page |}
type DP = {| makeNavigateToPage: Page => () => mixed |}
type Props = { ...SP, ...DP }

const SettingsSidebar = (props: Props) => (
  <SidePanel title={i18n.t('nav.tab_name.settings')}>
    <PDTitledList
      className={styles.sidebar_item}
      selected={props.currentPage === 'settings-app'}
      onClick={props.makeNavigateToPage('settings-app')}
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

const DTP = (dispatch: ThunkDispatch<*>): DP => ({
  makeNavigateToPage: (pageName: Page) => () =>
    dispatch(actions.navigateToPage(pageName)),
})

export default connect<Props, {||}, SP, DP, _, _>(
  STP,
  DTP
)(SettingsSidebar)
