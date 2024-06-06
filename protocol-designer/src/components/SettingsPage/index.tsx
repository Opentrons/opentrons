import * as React from 'react'
import { useSelector } from 'react-redux'

import { selectors } from '../../navigation'
import { SettingsApp } from './SettingsApp'

export { SettingsSidebar } from './SettingsSidebar'

export function SettingsPage(): JSX.Element {
  const currentPage = useSelector(selectors.getCurrentPage)
  switch (currentPage) {
    // TODO: Ian 2019-08-21 when we have other pages, put them here
    case 'settings-app':
    default:
      return <SettingsApp />
  }
}
