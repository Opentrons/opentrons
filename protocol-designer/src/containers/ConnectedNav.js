// @flow
import * as React from 'react'
import type {ThunkDispatch, BaseState} from '../types'
import {connect} from 'react-redux'

import {KNOWLEDGEBASE_ROOT_URL} from '../components/KnowledgeBaseLink'
import {NavTab, TabbedNavBar, OutsideLinkTab} from '@opentrons/components'
import i18n from '../localization'
import {type Page, actions, selectors} from '../navigation'

type Props = {
  currentPage: Page,
  handleClick: Page => (e: ?SyntheticEvent<>) => void,
}

function Nav (props: Props) {
  return (
    <TabbedNavBar
      topChildren={
        <React.Fragment>
          <NavTab
            iconName='ot-file'
            title={i18n.t('nav.file')}
            selected={props.currentPage === 'file-splash' || props.currentPage === 'file-detail'}
            onClick={props.handleClick('file-detail')} />
          <NavTab
            iconName='water'
            title={i18n.t('nav.liquids')}
            disabled={props.currentPage === 'file-splash'}
            selected={props.currentPage === 'liquids'}
            onClick={props.handleClick('liquids')} />
          <NavTab
            iconName='ot-design'
            title={i18n.t('nav.design')}
            disabled={props.currentPage === 'file-splash'}
            selected={props.currentPage === 'steplist' || props.currentPage === 'ingredient-detail'}
            onClick={props.handleClick('steplist')} />
        </React.Fragment>
      }
      bottomChildren={
        <React.Fragment>
          <OutsideLinkTab
            iconName='help-circle'
            title={i18n.t('nav.help')}
            to={KNOWLEDGEBASE_ROOT_URL} />
          <NavTab
            iconName='settings'
            title={i18n.t('nav.settings')}
            selected={props.currentPage === 'settings-privacy'}
            onClick={props.handleClick('settings-privacy')} />
        </React.Fragment>
      }
    />
  )
}

function mapStateToProps (state: BaseState) {
  return {
    currentPage: selectors.currentPage(state),
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>) {
  return {
    handleClick: (pageName: Page) => () => dispatch(actions.navigateToPage(pageName)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Nav)
