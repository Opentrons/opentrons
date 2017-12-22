// @flow
import * as React from 'react'

import {DeckFactory} from '@opentrons/components'
import ConnectedLabwareItem from './ConnectedLabwareItem'
import styles from './deck.css'

const DeckComponent = DeckFactory(ConnectedLabwareItem)

export default function Deck () {
  return <DeckComponent className={styles.deck} />
}
