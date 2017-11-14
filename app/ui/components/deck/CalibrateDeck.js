import React from 'react'
// import PropTypes from 'prop-types'
import Deck from './Deck'
import ReviewLabware from './ReviewLabware'
import styles from './deck.css' // Labware should have own styles once SVG wells generated

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
    </section>
  )
}
