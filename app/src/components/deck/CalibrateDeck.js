// TODO(mc, 2018-02-08): enable flow when react-router decides to chill out
//   ContextRouter exact type seems to mess with things, see (I think):
//   https://github.com/digiaonline/react-flow-types/issues/12 and
//   https://github.com/facebook/flow/issues/2405
import React from 'react'

import {Deck} from '@opentrons/components'
import ConnectedLabwareItem from './ConnectedLabwareItem'

import styles from './deck.css'

export default function CalibrateDeck () {
  return (
    <Deck
      LabwareComponent={ConnectedLabwareItem}
      className={styles.deck}
    />
  )
}
