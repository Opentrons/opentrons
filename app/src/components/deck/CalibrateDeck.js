import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import {Deck} from '@opentrons/components'
import ConnectedLabwareItem from './ConnectedLabwareItem'

import ReviewLabware from './ReviewLabware'
import CalibrationPrompt from './CalibrationPrompt'
import styles from './deck.css'

CalibrateDeck.propTypes = {
  slot: PropTypes.number.isRequired,
  deckPopulated: PropTypes.bool.isRequired
}

export default function CalibrateDeck (props) {
  const {deckPopulated, slot} = props
  const style = classnames({[styles.review_deck]: !deckPopulated})
  const Prompt = deckPopulated
    ? CalibrationPrompt
    : ReviewLabware

  return (
    <section className={style}>
      <Deck LabwareComponent={ConnectedLabwareItem} className={styles.deck} />
      <Prompt slot={slot} />
    </section>
  )
}

// TODO: toggle nextlabwarelink and confirmlabwareLinks on yes action on no is a to
