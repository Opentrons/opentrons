// @flow
import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { selectors } from '../navigation'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'

import { ConnectedStepList } from './ConnectedStepList'
import { IngredientsList } from './IngredientsList'
import { FileSidebar } from '../components/FileSidebar'
import { LiquidsSidebar } from '../components/LiquidsSidebar'
import { SettingsSidebar } from '../components/SettingsPage'

import { BaseState } from '../types'
import { Page } from '../navigation'

type Props = {
  page: Page
  liquidPlacementMode: boolean
}

function Sidebar(props: Props) {
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

const mapStateToProps: MapStateToProps<Props, {}, BaseState> = state => {
  const page = selectors.getCurrentPage(state)
  const liquidPlacementMode =
    labwareIngredSelectors.getSelectedLabwareId(state) != null

  return {
    page,
    liquidPlacementMode,
  }
}

export const ConnectedSidebar = connect(mapStateToProps)(Sidebar)
