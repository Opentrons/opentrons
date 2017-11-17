import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

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
  const style = classnames({[styles.review_deck]: !labwareReviewed})
  const Prompt = labwareReviewed
    ? CalibrationPrompt
    : ReviewLabware

  return (
    <section className={style}>
      <Deck slot={slot} />
      <Prompt slot={slot} />
    </section>
  )
}

// TODO: toggle nextlabwarelink and confirmlabwareLinks on yes action on no is a to
