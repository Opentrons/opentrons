// @flow
import * as React from 'react'
import type { ThunkDispatch, BaseState } from '../types'
import { connect } from 'react-redux'

import { KNOWLEDGEBASE_ROOT_URL } from '../components/KnowledgeBaseLink'
import { NavTab, TabbedNavBar, OutsideLinkTab } from '@opentrons/components'
import { i18n } from '../localization'
import { type Page, actions, selectors } from '../navigation'
import { selectors as fileSelectors } from '../file-data'

type SP = {|
  currentPage: Page,
  currentProtocolExists: boolean,
|}

type DP = {| handleClick: Page => (e: ?SyntheticEvent<>) => void |}

type Props = {| ...SP, ...DP |}

function Nav(props: Props) {
  const noCurrentProtocol = !props.currentProtocolExists
  return (
    <TabbedNavBar
      topChildren={
        <React.Fragment>
          <NavTab
            iconName="ot-file"
            title={i18n.t('nav.tab_name.file')}
            selected={
              props.currentPage === 'file-splash' ||
              props.currentPage === 'file-detail'
            }
            onClick={props.handleClick(
              noCurrentProtocol ? 'file-splash' : 'file-detail'
            )}
          />
          <NavTab
            iconName="water"
            title={i18n.t('nav.tab_name.liquids')}
            disabled={noCurrentProtocol}
            selected={props.currentPage === 'liquids'}
            onClick={props.handleClick('liquids')}
          />
          <NavTab
            iconName="ot-design"
            title={i18n.t('nav.tab_name.design')}
            disabled={noCurrentProtocol}
            selected={props.currentPage === 'steplist'}
            onClick={props.handleClick('steplist')}
          />
        </React.Fragment>
      }
      bottomChildren={
        <React.Fragment>
          <OutsideLinkTab
            iconName="help-circle"
            title={i18n.t('nav.tab_name.help')}
            to={KNOWLEDGEBASE_ROOT_URL}
          />
          <NavTab
            iconName="settings"
            title={i18n.t('nav.tab_name.settings')}
            selected={props.currentPage === 'settings-app'}
            onClick={props.handleClick('settings-app')}
          />
        </React.Fragment>
      }
    />
  )
}

function mapStateToProps(state: BaseState): SP {
  return {
    currentPage: selectors.getCurrentPage(state),
    currentProtocolExists: fileSelectors.getCurrentProtocolExists(state),
  }
}

function mapDispatchToProps(dispatch: ThunkDispatch<*>): DP {
  return {
    handleClick: (pageName: Page) => () => {
      dispatch(actions.navigateToPage(pageName))
    },
  }
}

export const ConnectedNav = connect<Props, {||}, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(Nav)
