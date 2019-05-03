// @flow
import React from 'react'
import { connect } from 'react-redux'

import { Deck, ClickOutside } from '@opentrons/components'
import styles from './Deck.css'
import i18n from '../localization'

import { Portal } from '../components/portals/MainPageModalPortal'
import BrowseLabwareModal from '../components/labware/BrowseLabwareModal'
import { DragPreviewLayer } from '../components/labware/LabwareOnDeck'
import Hints from '../components/Hints'
import LiquidPlacementModal from '../components/LiquidPlacementModal.js'
import LabwareContainer from '../containers/LabwareContainer.js'
import LabwareSelectionModal from '../components/LabwareSelectionModal'
import StepEditForm from '../components/StepEditForm'
import TimelineAlerts from '../components/alerts/TimelineAlerts'

import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import * as labwareIngredActions from '../labware-ingred/actions'
import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../steplist'
import { selectors as stepsSelectors } from '../ui/steps'

import type { BaseState, ThunkDispatch } from '../types'

type SP = {|
  selectedTerminalItemId: ?TerminalItemId,
  ingredSelectionMode: boolean,
  drilledDown: boolean,
|}

type DP = {| drillUpFromLabware: () => mixed |}

type Props = {| ...SP, handleClickOutside: () => mixed |}

const mapStateToProps = (state: BaseState): SP => ({
  selectedTerminalItemId: stepsSelectors.getSelectedTerminalItemId(state),
  ingredSelectionMode:
    labwareIngredSelectors.getSelectedLabwareId(state) != null,
  drilledDown: labwareIngredSelectors.getDrillDownLabwareId(state) != null,
})

const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DP => ({
  drillUpFromLabware: () => dispatch(labwareIngredActions.drillUpFromLabware()),
})

const mergeProps = (stateProps: SP, dispatchProps: DP): Props => ({
  selectedTerminalItemId: stateProps.selectedTerminalItemId,
  ingredSelectionMode: stateProps.ingredSelectionMode,
  drilledDown: stateProps.drilledDown,
  handleClickOutside: () => {
    if (stateProps.drilledDown) dispatchProps.drillUpFromLabware()
  },
})

// TODO Ian 2018-02-16 this will be broken apart and incorporated into ProtocolEditor
class DeckSetup extends React.Component<Props> {
  renderDeck = () => {
    const { selectedTerminalItemId } = this.props
    return (
      <React.Fragment>
        <div className={styles.deck_header}>
          {selectedTerminalItemId
            ? i18n.t(
                `deck.header.${
                  selectedTerminalItemId === START_TERMINAL_ITEM_ID
                    ? 'start'
                    : 'end'
                }`
              )
            : null}
        </div>
        <div className={styles.deck_row}>
          {this.props.drilledDown && <BrowseLabwareModal />}
          <ClickOutside onClickOutside={this.props.handleClickOutside}>
            {({ ref }) => (
              <div ref={ref} className={styles.deck_wrapper}>
                <Deck
                  DragPreviewLayer={DragPreviewLayer}
                  LabwareComponent={LabwareContainer}
                />
              </div>
            )}
          </ClickOutside>
        </div>
      </React.Fragment>
    )
  }

  render() {
    const startTerminalItemSelected =
      this.props.selectedTerminalItemId === START_TERMINAL_ITEM_ID

    // NOTE: besides `Deck`, these are all modal-like components that show up
    // only when user is on deck setup / ingred selection "page".
    // Once DeckSetup is broken apart and moved into ProtocolEditor,
    // this will go away
    return (
      <React.Fragment>
        <Portal>
          <TimelineAlerts />
          <Hints />
          {startTerminalItemSelected && <LabwareSelectionModal />}
          {!startTerminalItemSelected && <StepEditForm />}
          {startTerminalItemSelected && this.props.ingredSelectionMode && (
            <LiquidPlacementModal />
          )}
        </Portal>
        {this.renderDeck()}
      </React.Fragment>
    )
  }
}

export default connect<Props, {||}, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(DeckSetup)
