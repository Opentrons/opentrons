// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { FileSidebar } from '../components/FileSidebar'
import { LiquidsSidebar } from '../components/LiquidsSidebar'
import { SettingsSidebar } from '../components/SettingsPage'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import type { Page } from '../navigation'
import { selectors } from '../navigation'
import type { BaseState } from '../types'
import { ConnectedStepList } from './ConnectedStepList'
import { IngredientsList } from './IngredientsList'

type Props = {
  page: Page,
  liquidPlacementMode: boolean,
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

function mapStateToProps(state: BaseState): $Exact<Props> {
  const page = selectors.getCurrentPage(state)
  const liquidPlacementMode =
    labwareIngredSelectors.getSelectedLabwareId(state) != null

  return {
    page,
    liquidPlacementMode,
  }
}

export const ConnectedSidebar: React.AbstractComponent<{||}> = connect<
  Props,
  {||},
  _,
  _,
  _,
  _
>(mapStateToProps)(Sidebar)
