// @flow
import React from 'react'
import {connect} from 'react-redux'

import type {BaseState} from '../types'
import {selectors, type Page} from '../../navigation'
import Privacy from './Privacy'

export {default as SettingsSidebar} from './SettingsSidebar'

type Props = {currentPage: Page}

const SettingsPage = (props: Props) => {
  switch (props.currentPage) {
    case 'settings-features': {
      // TODO: BC 2018-09-01 when we have feature flags put them here
      return <div>Feature Flags Coming Soon...</div>
    }
    case 'settings-privacy':
    default:
      return <Privacy />
  }
}

const STP = (state: BaseState) => ({
  currentPage: selectors.currentPage(state)
})

export default connect(STP)(SettingsPage)
