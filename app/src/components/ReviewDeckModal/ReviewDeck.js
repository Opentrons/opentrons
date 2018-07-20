// @flow
// deckmap component for ReviewDeckModal of labware calibration page
import React from 'react'

import {Deck} from '@opentrons/components'
import LabwareComponent from './LabwareComponent'

import styles from './styles.css'

export default function CalibrateDeck () {
  return (
    <Deck LabwareComponent={LabwareComponent} className={styles.deck} />
  )
}
