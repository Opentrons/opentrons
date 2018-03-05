// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {Splash} from '@opentrons/components'

import ConnectedDeckSetup from '../containers/ConnectedDeckSetup'
import ConnectedFilePage from '../containers/ConnectedFilePage'

import type {BaseState} from '../types'
import {selectors, type Page} from '../navigation'

export default connect(mapStateToProps)(MainPanel)

type Props = {page: Page}

function MainPanel (props: Props) {
  const {page} = props
  if (page === 'file-splash') {
    return <Splash />
  }
  if (page === 'file-detail') {
    return <ConnectedFilePage />
  }
  // all other pages show the deck setup
  return <ConnectedDeckSetup />
}

function mapStateToProps (state: BaseState): Props {
  return {
    page: selectors.currentPage(state)
  }
}
