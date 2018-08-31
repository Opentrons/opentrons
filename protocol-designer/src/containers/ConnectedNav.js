// @flow
import * as React from 'react'
import type {ThunkDispatch, BaseState} from '../types'
import {connect} from 'react-redux'

import {KNOWLEDGEBASE_ROOT_URL} from '../components/KnowledgeBaseLink'
import {NavButton, VerticalNavBar, OutsideLinkButton} from '@opentrons/components'
import i18n from '../localization'
import {type Page, actions, selectors} from '../navigation'
import styles from './NavBar.css'

type Props = {
  currentPage: Page,
  handleClick: Page => (e: ?SyntheticEvent<>) => void
}

function Nav (props: Props) {
  return (
    <VerticalNavBar className={styles.nav_bar}>
      <div className={styles.top_buttons}>
        <NavButton
          iconName='ot-file'
          title={i18n.t('nav.file')}
          selected={props.currentPage === 'file-splash' || props.currentPage === 'file-detail'}
          onClick={props.handleClick('file-detail')} />
        <NavButton
          iconName='ot-design'
          title={i18n.t('nav.design')}
          disabled={props.currentPage === 'file-splash'}
          selected={props.currentPage === 'steplist' || props.currentPage === 'ingredient-detail'}
          onClick={props.handleClick('steplist')} />
      </div>
      <div className={styles.bottom_buttons}>
        <NavButton
          iconName='settings'
          title={i18n.t('nav.settings')}
          selected={props.currentPage === 'settings'}
          onClick={props.handleClick('settings')} />
        <OutsideLinkButton
          iconName='help-circle'
          title={i18n.t('nav.help')}
          to={KNOWLEDGEBASE_ROOT_URL} />
      </div>
    </VerticalNavBar>
  )
}

function mapStateToProps (state: BaseState) {
  return {
    currentPage: selectors.currentPage(state)
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>) {
  return {
    handleClick: (pageName: Page) => () => dispatch(actions.navigateToPage(pageName))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Nav)
