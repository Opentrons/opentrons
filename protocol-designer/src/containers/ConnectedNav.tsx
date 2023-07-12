import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { connect } from 'react-redux'

import { KNOWLEDGEBASE_ROOT_URL } from '../components/KnowledgeBaseLink'
import { NavTab, TabbedNavBar, OutsideLinkTab } from '@opentrons/components'
import { Page, actions, selectors } from '../navigation'
import { selectors as fileSelectors } from '../file-data'
import type { ThunkDispatch, BaseState } from '../types'

interface SP {
  currentPage: Page
  currentProtocolExists: boolean
}

interface DP {
  handleClick: (page: Page) => React.MouseEventHandler
}

type Props = SP & DP

function Nav(props: Props): JSX.Element {
  const noCurrentProtocol = !props.currentProtocolExists
  const { t } = useTranslation('nav')
  return (
    <TabbedNavBar
      topChildren={
        <React.Fragment>
          <NavTab
            id="NavTab_file"
            iconName="ot-file"
            title={t('tab_name.file')}
            selected={
              props.currentPage === 'file-splash' ||
              props.currentPage === 'file-detail'
            }
            onClick={props.handleClick(
              noCurrentProtocol ? 'file-splash' : 'file-detail'
            )}
          />
          <NavTab
            id="NavTab_liquids"
            iconName="water"
            title={t('tab_name.liquids')}
            disabled={noCurrentProtocol}
            selected={props.currentPage === 'liquids'}
            onClick={props.handleClick('liquids')}
          />
          <NavTab
            id="NavTab_design"
            iconName="ot-design"
            title={t('tab_name.design')}
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
            title={t('tab_name.help')}
            to={KNOWLEDGEBASE_ROOT_URL}
          />
          <NavTab
            iconName="settings"
            title={t('tab_name.settings')}
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

function mapDispatchToProps(dispatch: ThunkDispatch<any>): DP {
  return {
    handleClick: (pageName: Page) => () => {
      dispatch(actions.navigateToPage(pageName))
    },
  }
}

export const ConnectedNav = connect(mapStateToProps, mapDispatchToProps)(Nav)
