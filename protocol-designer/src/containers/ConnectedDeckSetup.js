// @flow
import React from 'react'
import {connect} from 'react-redux'

import {Deck, ClickOutside} from '@opentrons/components'
import styles from './Deck.css'

import IngredientSelectionModal from '../components/IngredientSelectionModal.js'
import LabwareContainer from '../containers/LabwareContainer.js'
import LabwareDropdown from '../containers/LabwareDropdown.js'

import {selectors} from '../labware-ingred/reducers'
import * as actions from '../labware-ingred/actions'
import {selectors as steplistSelectors} from '../steplist'
import type {BaseState, ThunkDispatch} from '../types'

const ingredSelModIsVisible = activeModals => activeModals.ingredientSelection && activeModals.ingredientSelection.slot
const DECK_HEADER = 'Tell the robot where labware and liquids start on the deck'

type StateProps = {
  deckSetupMode: boolean,
  ingredSelectionMode: boolean
}
type DispatchProps = {cancelMoveLabwareMode: () => mixed}

const mapStateToProps = (state: BaseState): StateProps => ({
  deckSetupMode: steplistSelectors.deckSetupMode(state),
  // TODO SOON remove all uses of the `activeModals` selector
  ingredSelectionMode: !!ingredSelModIsVisible(selectors.activeModals(state))
})

const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DispatchProps => ({
  cancelMoveLabwareMode: () => dispatch(actions.setMoveLabwareMode())
})

// TODO Ian 2018-02-16 this will be broken apart and incorporated into ProtocolEditor
class DeckSetup extends React.Component<StateProps & DispatchProps> {
  renderDeck = () => (
    <div className={styles.deck_row}>
      <ClickOutside onClickOutside={this.props.cancelMoveLabwareMode}>
        {({ref}) => (
          <div ref={ref}>
            <Deck LabwareComponent={LabwareContainer} className={styles.deck} />
          </div>
        )}
      </ClickOutside>
    </div>
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
      <div>
        <LabwareDropdown />
        {this.props.ingredSelectionMode && <IngredientSelectionModal />}
        <div className={styles.deck_header}>{DECK_HEADER}</div>
        {this.renderDeck()}
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DeckSetup)
