// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {selectors} from '../navigation'

import ConnectedStepList from './ConnectedStepList'
import IngredientsList from './IngredientsList'
import FileSidebar from '../components/FileSidebar'
import { SettingsSidebar } from '../components/SettingsPage'

import type {BaseState} from '../types'
import type {Page} from '../navigation'

type Props = {
  page: Page,
}

function Sidebar (props: Props) {
  switch (props.page) {
    case 'steplist':
    case 'well-selection-modal':
      return <ConnectedStepList />
    case 'ingredient-detail':
      return <IngredientsList />
    case 'file-splash':
    case 'file-detail':
      return <FileSidebar />
    case 'settings-features':
    case 'settings-privacy':
      return <SettingsSidebar />
  }
  return null
}

function mapStateToProps (state: BaseState): Props {
  const page = selectors.currentPage(state)

  return {
    page,
  }
}

export default connect(mapStateToProps)(Sidebar)
