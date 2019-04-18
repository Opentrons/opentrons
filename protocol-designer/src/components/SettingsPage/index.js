// @flow
import React from 'react'
import { connect } from 'react-redux'

import type { BaseState } from '../../types'
import { selectors, type Page } from '../../navigation'
import SettingsApp from './SettingsApp'

export { default as SettingsSidebar } from './SettingsSidebar'

type Props = { currentPage: Page }

const SettingsPage = (props: Props) => {
  switch (props.currentPage) {
    case 'settings-features': {
      // TODO: BC 2018-09-01 when we have feature flags put them here
      return <div>Feature Flags Coming Soon...</div>
    }
    case 'settings-app':
    default:
      return <SettingsApp />
  }
}

const STP = (state: BaseState): $Exact<Props> => ({
  currentPage: selectors.getCurrentPage(state),
})

export default connect<Props, {||}, $Exact<Props>, _, _, _>(STP)(SettingsPage)
