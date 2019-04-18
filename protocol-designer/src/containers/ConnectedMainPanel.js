// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { Splash } from '@opentrons/components'

import ConnectedDeckSetup from '../containers/ConnectedDeckSetup'
import ConnectedFilePage from '../containers/ConnectedFilePage'
import SettingsPage from '../components/SettingsPage'
import LiquidsPage from '../components/LiquidsPage'

import type { BaseState } from '../types'
import { selectors, type Page } from '../navigation'

type Props = { page: Page }

export default connect<Props, {||}, _, _, _, _>(mapStateToProps)(MainPanel)

function MainPanel(props: Props) {
  const { page } = props
  switch (page) {
    case 'file-splash':
      return <Splash />
    case 'file-detail':
      return <ConnectedFilePage />
    case 'liquids':
      return <LiquidsPage />
    case 'settings-app':
      return <SettingsPage />
    default:
      return <ConnectedDeckSetup />
  }
}

function mapStateToProps(state: BaseState): $Exact<Props> {
  return {
    page: selectors.getCurrentPage(state),
  }
}
