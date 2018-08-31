// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {Splash} from '@opentrons/components'

import ConnectedDeckSetup from '../containers/ConnectedDeckSetup'
import ConnectedFilePage from '../containers/ConnectedFilePage'
import SettingsPage from '../components/SettingsPage'

import type {BaseState} from '../types'
import {selectors, type Page} from '../navigation'

export default connect(mapStateToProps)(MainPanel)

type Props = {page: Page}

function MainPanel (props: Props) {
  const {page} = props
  switch (page) {
    case 'file-splash':
      return <Splash />
    case 'file-detail':
      return <ConnectedFilePage />
    case 'settings':
      return <SettingsPage />
    default:
      return <ConnectedDeckSetup />
  }
}

function mapStateToProps (state: BaseState): Props {
  return {
    page: selectors.currentPage(state)
  }
}
