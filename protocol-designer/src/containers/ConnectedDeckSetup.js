// @flow
import React from 'react'
import {connect} from 'react-redux'

import {Deck, ClickOutside} from '@opentrons/components'
import styles from './Deck.css'

import IngredientSelectionModal from '../components/IngredientSelectionModal.js'
import LabwareContainer from '../containers/LabwareContainer.js'
import LabwareSelectionModal from '../components/LabwareSelectionModal'
import BrowseLabwareModal from '../components/labware/BrowseLabwareModal'

import {selectors} from '../labware-ingred/reducers'
import * as actions from '../labware-ingred/actions'
import {selectors as steplistSelectors, START_TERMINAL_ITEM_ID} from '../steplist'

import type {BaseState, ThunkDispatch} from '../types'

const ingredSelModIsVisible = activeModals => activeModals.ingredientSelection && activeModals.ingredientSelection.slot

type StateProps = {
  deckSetupMode: boolean,
  ingredSelectionMode: boolean,
  drilledDown: boolean,
  _moveLabwareMode: boolean,
}
type DispatchProps = {
  cancelMoveLabwareMode: () => mixed,
  drillUpFromLabware: () => mixed,
}
type Props = {
  deckSetupMode: boolean,
  header: string,
  drilledDown: boolean,
  ingredSelectionMode: boolean,
  handleClickOutside: () => void,
}

const mapStateToProps = (state: BaseState): StateProps => ({
  deckSetupMode: (
    steplistSelectors.getSelectedTerminalItemId(state) === START_TERMINAL_ITEM_ID
  ),
  // TODO SOON remove all uses of the `activeModals` selector
  ingredSelectionMode: !!ingredSelModIsVisible(selectors.activeModals(state)),
  drilledDown: !!selectors.getDrillDownLabwareId(state),
  _moveLabwareMode: !!selectors.slotToMoveFrom(state),
})

const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DispatchProps => ({
  cancelMoveLabwareMode: () => dispatch(actions.setMoveLabwareMode()),
  drillUpFromLabware: () => dispatch(actions.drillUpFromLabware()),
})

const mergeProps = (stateProps: StateProps, dispatchProps: DispatchProps): Props => ({
  deckSetupMode: stateProps.deckSetupMode,
  ingredSelectionMode: stateProps.ingredSelectionMode,
  drilledDown: stateProps.drilledDown,
  handleClickOutside: () => {
    if (stateProps._moveLabwareMode) dispatchProps.cancelMoveLabwareMode()
    if (stateProps.drilledDown) dispatchProps.drillUpFromLabware()
  },
})

// TODO Ian 2018-02-16 this will be broken apart and incorporated into ProtocolEditor
class DeckSetup extends React.Component<Props> {
  renderDeck = () => (
    <React.Fragment>
      <div className={styles.deck_header}>{this.props.header}</div>
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

  render () {
    if (!this.props.deckSetupMode) {
      // Temporary quickfix: if we're not in deck setup mode,
      // hide the labware dropdown and ingredient selection modal
      // and just show the deck.
      // TODO Ian 2018-05-30 this shouldn't be a responsibility of DeckSetup
      return this.renderDeck()
    }

    // NOTE: besides `Deck`, these are all modal-like components that show up
    // only when user is on deck setup / ingred selection "page".
    // Once DeckSetup is broken apart and moved into ProtocolEditor,
    // this will go away
    return (
      <React.Fragment>
        <LabwareSelectionModal />
        {this.props.ingredSelectionMode && <IngredientSelectionModal />}
        {this.renderDeck()}
      </React.Fragment>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(DeckSetup)
