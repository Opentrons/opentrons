import { DeckSetupManager } from '../components/DeckSetupManager'
import { FormManager } from '../components/FormManager'
import { Hints } from '../components/Hints'
import { LabwareSelectionModal } from '../components/LabwareSelectionModal'
import { LiquidPlacementModal } from '../components/LiquidPlacementModal'
import { LiquidsPage } from '../components/LiquidsPage'
import { SettingsPage } from '../components/SettingsPage'
import { TimelineAlerts } from '../components/alerts/TimelineAlerts'
import { Portal as MainPageModalPortal } from '../components/portals/MainPageModalPortal'
import { ConnectedFilePage } from '../containers/ConnectedFilePage'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import { selectors, Page } from '../navigation'
import { START_TERMINAL_ITEM_ID, TerminalItemId } from '../steplist'
import { BaseState } from '../types'
import { getSelectedTerminalItemId } from '../ui/steps'
import { Splash } from '@opentrons/components'
import * as React from 'react'
import { connect } from 'react-redux'

interface Props {
  page: Page
  selectedTerminalItemId: TerminalItemId | null | undefined
  ingredSelectionMode: boolean
}

function MainPanelComponent(props: Props): JSX.Element {
  const { page, selectedTerminalItemId, ingredSelectionMode } = props
  switch (page) {
    case 'file-splash':
      return <Splash />
    case 'file-detail':
      return <ConnectedFilePage />
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
            <TimelineAlerts />
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

function mapStateToProps(state: BaseState): Props {
  return {
    page: selectors.getCurrentPage(state),
    selectedTerminalItemId: getSelectedTerminalItemId(state),
    ingredSelectionMode:
      labwareIngredSelectors.getSelectedLabwareId(state) != null,
  }
}

export const ConnectedMainPanel = connect(mapStateToProps)(MainPanelComponent)
