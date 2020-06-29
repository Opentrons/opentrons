// @flow
import { Splash } from '@opentrons/components'
import * as React from 'react'
import { connect } from 'react-redux'

import { TimelineAlerts } from '../components/alerts/TimelineAlerts'
import { DeckSetup } from '../components/DeckSetup'
import { Hints } from '../components/Hints'
import { LabwareSelectionModal } from '../components/LabwareSelectionModal'
import { LiquidPlacementModal } from '../components/LiquidPlacementModal.js'
import { LiquidsPage } from '../components/LiquidsPage'
import { Portal as MainPageModalPortal } from '../components/portals/MainPageModalPortal'
import { SettingsPage } from '../components/SettingsPage'
import { StepEditForm } from '../components/StepEditForm'
import { ConnectedFilePage } from '../containers/ConnectedFilePage'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import { type Page, selectors } from '../navigation'
import { type TerminalItemId, START_TERMINAL_ITEM_ID } from '../steplist'
import type { BaseState } from '../types'
import { getSelectedTerminalItemId } from '../ui/steps'

type Props = {
  page: Page,
  selectedTerminalItemId: ?TerminalItemId,
  ingredSelectionMode: boolean,
}

function MainPanelComponent(props: Props) {
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
            <StepEditForm />
            {startTerminalItemSelected && ingredSelectionMode && (
              <LiquidPlacementModal />
            )}
          </MainPageModalPortal>
          <DeckSetup />
        </>
      )
    }
  }
}

function mapStateToProps(state: BaseState): $Exact<Props> {
  return {
    page: selectors.getCurrentPage(state),
    selectedTerminalItemId: getSelectedTerminalItemId(state),
    ingredSelectionMode:
      labwareIngredSelectors.getSelectedLabwareId(state) != null,
  }
}

export const ConnectedMainPanel: React.AbstractComponent<{||}> = connect<
  Props,
  {||},
  _,
  _,
  _,
  _
>(mapStateToProps)(MainPanelComponent)
