import React from 'react'
import PropTypes from 'prop-types'

import Deck from './Deck'
import ReviewLabware from './ReviewLabware'
import CalibrationPrompt from './CalibrationPrompt'
import styles from './deck.css'

CalibrateDeck.propTypes = {
  slot: PropTypes.number.isRequired,
  labwareReviewed: PropTypes.bool.isRequired
}

export default function CalibrateDeck (props) {
  const {labwareReviewed, slot} = props
  if (!labwareReviewed) {
    return (
      <section className={styles.review_deck}>
        <Deck slot={slot} />
        <ReviewLabware slot={slot} />
      </section>
    )
  }
  return (
    <section>
      <Deck slot={slot} />
      <CalibrationPrompt slot={slot} />
    </section>
  )
}

// TODO: toggle nextlabwarelink and confirmlabwareLinks on yes action on no is a to
