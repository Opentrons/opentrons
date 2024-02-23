import * as React from 'react'
import { useSelector } from 'react-redux'
import { Splash } from '@opentrons/components'
import { START_TERMINAL_ITEM_ID } from '../steplist'
import { Portal as MainPageModalPortal } from '../components/portals/MainPageModalPortal'
import { DeckSetupManager } from '../components/DeckSetupManager'
import { SettingsPage } from '../components/SettingsPage'
import { FilePage } from '../components/FilePage'
import { LiquidsPage } from '../components/LiquidsPage'
import { Hints } from '../components/Hints'
import { LiquidPlacementModal } from '../components/LiquidPlacementModal'
import { LabwareSelectionModal } from '../components/LabwareSelectionModal/LabwareSelectionModal'
import { FormManager } from '../components/FormManager'
import { Alerts } from '../components/alerts/Alerts'
import { getSelectedTerminalItemId } from '../ui/steps'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import { selectors } from '../navigation'

export function MainPanel(): JSX.Element {
  const page = useSelector(selectors.getCurrentPage)
  const selectedTerminalItemId = useSelector(getSelectedTerminalItemId)
  const selectedLabware = useSelector(
    labwareIngredSelectors.getSelectedLabwareId
  )
  const ingredSelectionMode = selectedLabware != null

  switch (page) {
    case 'file-splash':
      return <Splash />
    case 'file-detail':
      return <FilePage />
    case 'liquids':
      return <LiquidsPage />
    case 'settings-app':
      return <SettingsPage />
    default: {
      const startTerminalItemSelected =
        selectedTerminalItemId === START_TERMINAL_ITEM_ID
      return (
        <>
          <MainPageModalPortal>
            <Alerts componentType="Timeline" />
            <Hints />
            {startTerminalItemSelected && <LabwareSelectionModal />}
            <FormManager />
            {startTerminalItemSelected && ingredSelectionMode && (
              <LiquidPlacementModal />
            )}
          </MainPageModalPortal>
          <DeckSetupManager />
        </>
      )
    }
  }
}
