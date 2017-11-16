import React from 'react'
import { connect } from 'react-redux'

import {
  closeIngredientSelector
} from '../actions'

import { selectors } from '../reducers'
import Deck from './Deck.js'

const ConnectedDeck = connect(
  state => ({
    activeModals: selectors.activeModals(state)
  }),
  {
    closeIngredientSelector
  }
)(Deck)

const Home = () => (
  <div>
    <ConnectedDeck />
    <h2>Select labware you wish to add ingredients to</h2>
  </div>
)

export default Home
