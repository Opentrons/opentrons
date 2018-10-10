// @flow
import * as React from 'react'
import {SidePanel} from '@opentrons/components'
import {connect} from 'react-redux'

import type {BaseState, ThunkDispatch} from '../../types'
import {actions, selectors, type Page} from '../../navigation'
import i18n from '../../localization'
import { PDTitledList } from '../lists'
import styles from './SettingsPage.css'

type SP = {currentPage: Page}
type DP = {makeNavigateToPage: (Page) => () => mixed}

const SettingsSidebar = (props: SP & DP) => (
  <SidePanel title={i18n.t('nav.tab_name.settings')}>
    <PDTitledList
      className={styles.sidebar_item}
      selected={props.currentPage === 'settings-privacy'}
      onClick={props.makeNavigateToPage('settings-privacy')}
      title={i18n.t('nav.settings.privacy')}/>
    {/* <PDTitledList
      disabled
      className={styles.sidebar_item}
      onClick={props.makeNavigateToPage('settings-features')}
      selected={props.currentPage === 'settings-features'}
      title={i18n.t('nav.settings.feature_flags')}/> */}
  </SidePanel>
)

const STP = (state: BaseState): SP => ({
  currentPage: selectors.currentPage(state),
})

const DTP = (dispatch: ThunkDispatch<*>): DP => ({
  makeNavigateToPage: (pageName: Page) => () => dispatch(actions.navigateToPage(pageName)),
})

export default connect(STP, DTP)(SettingsSidebar)
