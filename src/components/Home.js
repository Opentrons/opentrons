import React from 'react'
import { connect } from 'react-redux'

import {
  openLabwareSelector,
  closeLabwareSelector,
  openIngredientSelector,
  closeIngredientSelector,
  createContainerAtSlot,
  deleteContainerAtSlot
} from '../actions'

import { selectors } from '../reducers'
import Deck from './Deck.js'

const ConnectedDeck = connect(
  state => ({
    loadedContainers: selectors.loadedContainersBySlot(state),
    canAdd: selectors.canAdd(state),
    activeModals: selectors.activeModals(state)
  }),
  {
    openLabwareSelector,
    closeLabwareSelector,
    createContainerAtSlot,
    openIngredientSelector,
    closeIngredientSelector,
    deleteContainerAtSlot
  }
)(Deck)

const Home = () => (
  <div>
    <ConnectedDeck />
    <h2>Select labware you wish to add ingredients to</h2>
  </div>
)

export default Home
