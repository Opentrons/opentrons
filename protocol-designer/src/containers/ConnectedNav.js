// @flow
import * as React from 'react'
import type {ThunkDispatch, BaseState} from '../types'
import {connect} from 'react-redux'

import {KNOWLEDGEBASE_ROOT_URL} from '../components/KnowledgeBaseLink'
import {NavTab, TabbedNavBar, OutsideLinkTab} from '@opentrons/components'
import i18n from '../localization'
import {type Page, actions, selectors} from '../navigation'
import {selectors as fileSelectors} from '../file-data'

type Props = {
  currentPage: Page,
  currentProtocolExists: boolean,
  handleClick: Page => (e: ?SyntheticEvent<>) => void,
}

function Nav (props: Props) {
  const noCurrentProtocol = !props.currentProtocolExists
  return (
    <TabbedNavBar
      topChildren={
        <React.Fragment>
          <NavTab
            iconName='ot-file'
            title={i18n.t('nav.tab_name.file')}
            selected={props.currentPage === 'file-splash' || props.currentPage === 'file-detail'}
            onClick={props.handleClick('file-detail')} />
          <NavTab
            iconName='water'
            title={i18n.t('nav.tab_name.liquids')}
            disabled={noCurrentProtocol}
            selected={props.currentPage === 'liquids'}
            onClick={props.handleClick('liquids')} />
          <NavTab
            iconName='ot-design'
            title={i18n.t('nav.tab_name.design')}
            disabled={noCurrentProtocol}
            selected={props.currentPage === 'steplist'}
            onClick={props.handleClick('steplist')} />
        </React.Fragment>
      }
      bottomChildren={
        <React.Fragment>
          <OutsideLinkTab
            iconName='help-circle'
            title={i18n.t('nav.tab_name.help')}
            to={KNOWLEDGEBASE_ROOT_URL} />
          <NavTab
            iconName='settings'
            title={i18n.t('nav.tab_name.settings')}
            selected={props.currentPage === 'settings-app'}
            onClick={props.handleClick('settings-app')} />
        </React.Fragment>
      }
    />
  )
}

function mapStateToProps (state: BaseState) {
  return {
    currentPage: selectors.getCurrentPage(state),
    currentProtocolExists: fileSelectors.getCurrentProtocolExists(state),
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>) {
  return {
    handleClick: (pageName: Page) => () => dispatch(actions.navigateToPage(pageName)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Nav)
