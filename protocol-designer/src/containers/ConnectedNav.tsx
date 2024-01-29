import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { KNOWLEDGEBASE_ROOT_URL } from '../components/KnowledgeBaseLink'
import { NavTab, TabbedNavBar, OutsideLinkTab } from '@opentrons/components'
import { Page, actions, selectors } from '../navigation'
import { selectors as fileSelectors } from '../file-data'

export function ConnectedNav(): JSX.Element {
  const { t } = useTranslation('nav')

  const currentPage = useSelector(selectors.getCurrentPage)
  const currentProtocolExists = useSelector(
    fileSelectors.getCurrentProtocolExists
  )
  const dispatch = useDispatch()

  const handleClick = React.useMemo(
    () => (pageName: Page) => () => {
      dispatch(actions.navigateToPage(pageName))
    },
    [dispatch]
  )

  const noCurrentProtocol = !currentProtocolExists

  return (
    <TabbedNavBar
      topChildren={
        <>
          <NavTab
            id="NavTab_file"
            iconName="ot-file"
            title={t('tab_name.file')}
            selected={
              currentPage === 'file-splash' || currentPage === 'file-detail'
            }
            onClick={handleClick(
              noCurrentProtocol ? 'file-splash' : 'file-detail'
            )}
          />
          <NavTab
            id="NavTab_liquids"
            iconName="water"
            title={t('tab_name.liquids')}
            disabled={noCurrentProtocol}
            selected={currentPage === 'liquids'}
            onClick={handleClick('liquids')}
          />
          <NavTab
            id="NavTab_design"
            iconName="ot-design"
            title={t('tab_name.design')}
            disabled={noCurrentProtocol}
            selected={currentPage === 'steplist'}
            onClick={handleClick('steplist')}
          />
        </>
      }
      bottomChildren={
        <>
          <OutsideLinkTab
            iconName="help-circle"
            title={t('tab_name.help')}
            to={KNOWLEDGEBASE_ROOT_URL}
          />
          <NavTab
            iconName="settings"
            title={t('tab_name.settings')}
            selected={currentPage === 'settings-app'}
            onClick={handleClick('settings-app')}
          />
        </>
      }
    />
  )
}
