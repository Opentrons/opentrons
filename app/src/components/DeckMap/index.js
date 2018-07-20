// @flow
import React from 'react'

import {Deck} from '@opentrons/components'
import ConnectedSlotItem from './ConnectedSlotItem'

import styles from './styles.css'

export default function DeckMap () {
  return (
    <Deck
      // $FlowFixMe: I think ReactRouter type is causing problems here?
      LabwareComponent={ConnectedSlotItem}
      className={styles.deck}
    />
  )
}
