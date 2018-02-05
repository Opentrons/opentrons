// @flow
import React from 'react'
import classnames from 'classnames'

import {Deck} from '@opentrons/components'
import ConnectedLabwareItem from './ConnectedLabwareItem'

import ReviewLabware from './ReviewLabware'
import styles from './deck.css'

type Props = {
  slot: string,
  deckPopulated: boolean
}

export default function CalibrateDeck (props: Props) {
  const {deckPopulated, slot} = props
  const style = classnames({[styles.review_deck]: !deckPopulated})

  return (
    <section className={style}>
      <Deck LabwareComponent={ConnectedLabwareItem} className={styles.deck} />
      {!deckPopulated && <ReviewLabware slot={slot} />}
    </section>
  )
}

// TODO: toggle nextlabwarelink and confirmlabwareLinks on yes action on no is a to
