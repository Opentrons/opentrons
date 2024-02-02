import * as React from 'react'
import { useSelector } from 'react-redux'
import { selectors } from '../navigation'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'

import { StepList } from '../components/steplist'
import { FileSidebar } from '../components/FileSidebar/FileSidebar'
import { LiquidsSidebar } from '../components/LiquidsSidebar'
import { SettingsSidebar } from '../components/SettingsPage'
import { IngredientsList } from '../components/IngredientsList'

export function Sidebar(): JSX.Element | null {
  const page = useSelector(selectors.getCurrentPage)
  const selectedLabware = useSelector(
    labwareIngredSelectors.getSelectedLabwareId
  )
  const liquidPlacementMode = selectedLabware != null
  switch (page) {
    case 'liquids':
      return <LiquidsSidebar />
    case 'steplist':
      return liquidPlacementMode ? <IngredientsList /> : <StepList />
    case 'file-splash':
    case 'file-detail':
      return <FileSidebar />
    case 'settings-features':
    case 'settings-app':
      return <SettingsSidebar />
  }
  return null
}
