// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { BaseState } from '../../types'
import { selectors,  Page } from '../../navigation'
import { SettingsApp } from './SettingsApp'

export { SettingsSidebar } from './SettingsSidebar'

type Props = { currentPage: Page }

const SettingsPageComponent = (props: Props) => {
  switch (props.currentPage) {
    // TODO: Ian 2019-08-21 when we have other pages, put them here
    case 'settings-app':
    default:
      return <SettingsApp />
  }
}

const STP = (state: BaseState): Props => ({
  currentPage: selectors.getCurrentPage(state),
})

export const SettingsPage: React.AbstractComponent<{}> = connect<
  Props,
  {},
  Props,
  _,
  _,
  _
>(STP)(SettingsPageComponent)
