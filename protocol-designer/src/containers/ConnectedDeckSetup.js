// @flow
import React from 'react'
import {connect} from 'react-redux'

import {Deck} from '@opentrons/components'
import styles from './Deck.css'

import IngredientSelectionModal from '../components/IngredientSelectionModal.js'
import LabwareContainer from '../containers/LabwareContainer.js'
import LabwareDropdown from '../containers/LabwareDropdown.js'

import {selectors} from '../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../steplist'
import type {BaseState} from '../types'

const ingredSelModIsVisible = activeModals => activeModals.ingredientSelection && activeModals.ingredientSelection.slot
const DECK_HEADER = 'Tell the robot where labware and liquids start on the deck'

type DeckSetupProps = {
  deckSetupMode: boolean,
  ingredSelectionMode: boolean
}

function mapStateToProps (state: BaseState): DeckSetupProps {
  return {
    deckSetupMode: steplistSelectors.deckSetupMode(state),
    // TODO SOON remove all uses of the `activeModals` selector
    ingredSelectionMode: !!ingredSelModIsVisible(selectors.activeModals(state))
  }
}

// TODO Ian 2018-02-16 this will be broken apart and incorporated into ProtocolEditor
function DeckSetup (props: DeckSetupProps) {
  const deck = <Deck LabwareComponent={LabwareContainer} className={styles.deck} />
  if (!props.deckSetupMode) {
    // Temporary quickfix: if we're not in deck setup mode,
    // hide the labware dropdown and ingredient selection modal
    // and just show the deck.
    // TODO Ian 2018-05-30 this shouldn't be a responsibility of DeckSetup
    return deck
  }

  // NOTE: besides `Deck`, these are all modal-like components that show up
  // only when user is on deck setup / ingred selection "page".
  // Once DeckSetup is broken apart and moved into ProtocolEditor,
  // this will go away
  return (
    <div>
      <LabwareDropdown />
      {props.ingredSelectionMode && <IngredientSelectionModal />}
      <div className={styles.deck_header}>{DECK_HEADER}</div>
      {deck}
    </div>
  )
}

export default connect(mapStateToProps)(DeckSetup)
