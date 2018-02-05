// @flow
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
