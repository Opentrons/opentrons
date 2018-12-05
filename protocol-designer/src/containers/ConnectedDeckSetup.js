// @flow
import React from 'react'
import {connect} from 'react-redux'

import {Deck, ClickOutside} from '@opentrons/components'
import styles from './Deck.css'
import i18n from '../localization'

import {Portal} from '../components/portals/MainPageModalPortal'
import BrowseLabwareModal from '../components/labware/BrowseLabwareModal'
import Hints from '../components/Hints'
import LiquidPlacementModal from '../components/LiquidPlacementModal.js'
import LabwareContainer from '../containers/LabwareContainer.js'
import LabwareSelectionModal from '../components/LabwareSelectionModal'
import StepEditForm from '../components/StepEditForm'
import TimelineAlerts from '../components/alerts/TimelineAlerts'

import {selectors} from '../labware-ingred/reducers'
import * as actions from '../labware-ingred/actions'
import {selectors as steplistSelectors, START_TERMINAL_ITEM_ID, type TerminalItemId} from '../steplist'

import type {BaseState, ThunkDispatch} from '../types'

type StateProps = {
  selectedTerminalItemId: ?TerminalItemId,
  ingredSelectionMode: boolean,
  drilledDown: boolean,
  _moveLabwareMode: boolean,
}
type DispatchProps = {
  cancelMoveLabwareMode: () => mixed,
  drillUpFromLabware: () => mixed,
}
type Props = {
  selectedTerminalItemId: ?TerminalItemId,
  drilledDown: boolean,
  ingredSelectionMode: boolean,
  handleClickOutside: () => void,
}

const mapStateToProps = (state: BaseState): StateProps => ({
  selectedTerminalItemId: steplistSelectors.getSelectedTerminalItemId(state),
  ingredSelectionMode: Boolean(selectors.getSelectedLabware(state)),
  drilledDown: !!selectors.getDrillDownLabwareId(state),
  _moveLabwareMode: !!selectors.getSlotToMoveFrom(state),
})

const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DispatchProps => ({
  cancelMoveLabwareMode: () => dispatch(actions.setMoveLabwareMode()),
  drillUpFromLabware: () => dispatch(actions.drillUpFromLabware()),
})

const mergeProps = (stateProps: StateProps, dispatchProps: DispatchProps): Props => ({
  selectedTerminalItemId: stateProps.selectedTerminalItemId,
  ingredSelectionMode: stateProps.ingredSelectionMode,
  drilledDown: stateProps.drilledDown,
  handleClickOutside: () => {
    if (stateProps._moveLabwareMode) dispatchProps.cancelMoveLabwareMode()
    if (stateProps.drilledDown) dispatchProps.drillUpFromLabware()
  },
})

// TODO Ian 2018-02-16 this will be broken apart and incorporated into ProtocolEditor
class DeckSetup extends React.Component<Props> {
  renderDeck = () => {
    const {selectedTerminalItemId} = this.props
    return (
      <React.Fragment>
        <div className={styles.deck_header}>
          {
            selectedTerminalItemId
              ? i18n.t(`deck.header.${selectedTerminalItemId === START_TERMINAL_ITEM_ID ? 'start' : 'end'}`)
              : null
          }
        </div>
        <div className={styles.deck_row}>
          {this.props.drilledDown && <BrowseLabwareModal />}
          <ClickOutside onClickOutside={this.props.handleClickOutside}>
            {({ref}) => (
              <div ref={ref}>
                <Deck LabwareComponent={LabwareContainer} className={styles.deck} />
              </div>
            )}
          </ClickOutside>
        </div>
      </React.Fragment>
    )
  }

  render () {
    const startTerminalItemSelected = this.props.selectedTerminalItemId === START_TERMINAL_ITEM_ID

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
          {startTerminalItemSelected && this.props.ingredSelectionMode && <LiquidPlacementModal />}
        </Portal>
        {this.renderDeck()}
      </React.Fragment>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(DeckSetup)
