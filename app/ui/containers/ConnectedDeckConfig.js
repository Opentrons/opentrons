import React from 'react'
import {connect} from 'react-redux'

import DeckConfig from '../components/DeckConfig'

const mapStateToProps = (state) => ({

  // interface
  isMoving: false,
  isOverWell: true,
  currentLabware: {
    slot: 1,
    id: 'A1',
    name: 'tiprack',
    type: 'tiprack-200ul',
    isConfirmed: false,
    isTiprack: true
  },

  // robot
  isDeckmapReviewed: true,
  isTipracksConfirmed: true,
  isLabwareConfirmed: false,
  deck: [
    {
      slot: 1,
      name: 'tiprack',
      id: 'A1',
      type: 'tiprack-200ul',
      isConfirmed: true,
      isTiprack: true
    }, {
      slot: 2,
      name: 'trough',
      id: 'B1',
      type: 'trough-12row',
      isConfirmed: false,
      isTiprack: false
    }, {
      slot: 3,
      name: 'plate',
      id: 'C1',
      type: '96-PCR-flat',
      isConfirmed: false,
      isTiprack: false
    }, {
      slot: 4,
      name: 'tiprack2',
      id: 'A2',
      type: 'tiprack-200ul',
      isConfirmed: true,
      isTiprack: true
    }, {slot: 5},
    {
      slot: 6,
      name: 'tuberack',
      id: 'C2',
      type: 'tube-rack-2ml',
      isConfirmed: false,
      isTiprack: false
    },
    {slot: 7},
    {slot: 8},
    {slot: 9},
    {slot: 10},
    {slot: 11}
  ]
})

function ConnectedDeckConfig (props) {
  return (
    <DeckConfig {...props} />
  )
}

export default connect(mapStateToProps)(ConnectedDeckConfig)
