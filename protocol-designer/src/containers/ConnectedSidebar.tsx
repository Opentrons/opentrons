import * as React from 'react'
import { connect } from 'react-redux'
import { selectors, Page } from '../navigation'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'

import { ConnectedStepList } from './ConnectedStepList'
import { IngredientsList } from './IngredientsList'
import { FileSidebar } from '../components/FileSidebar/FileSidebar'
import { LiquidsSidebar } from '../components/LiquidsSidebar'
import { SettingsSidebar } from '../components/SettingsPage'

import { BaseState } from '../types'

interface Props {
  page: Page
  liquidPlacementMode: boolean
}

function Sidebar(props: Props): JSX.Element | null {
  switch (props.page) {
    case 'liquids':
      return <LiquidsSidebar />
    case 'steplist':
      return props.liquidPlacementMode ? (
        <IngredientsList />
      ) : (
        <ConnectedStepList />
      )
    case 'file-splash':
    case 'file-detail':
      return <FileSidebar />
    case 'settings-features':
    case 'settings-app':
      return <SettingsSidebar />
  }
  return null
}

function mapStateToProps(state: BaseState): Props {
  const page = selectors.getCurrentPage(state)
  const liquidPlacementMode =
    labwareIngredSelectors.getSelectedLabwareId(state) != null

  return {
    page,
    liquidPlacementMode,
  }
}

export const ConnectedSidebar = connect(mapStateToProps)(Sidebar)
