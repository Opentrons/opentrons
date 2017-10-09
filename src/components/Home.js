import React from 'react'
import { connect } from 'react-redux'

import Deck from './Deck.js'

const ConnectedDeck = connect(
  state => ({
    loadedContainers: {'A1': '96-deep-well'},
    canAdd: 'B1',
    modeLabwareSelection: false
  }),
  {
    openLabwareDropdown: payload => ({type: 'openLabwareDropdown', payload}),
    closeLabwareDropdown: payload => ({type: 'closeLabwareDropdown', payload})
  }
)(Deck)

const Home = () => (
  <div>
    <ConnectedDeck />
    <h2>Select labware you wish to add ingredients to</h2>
  </div>
)

export default Home
