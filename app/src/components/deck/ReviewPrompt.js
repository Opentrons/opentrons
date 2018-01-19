import React from 'react'
import PropTypes from 'prop-types'
import Button from '../Button'
import styles from './deck.css'

ReviewPrompt.propTypes = {
  setDeckPopulated: PropTypes.func.isRequired,
  moveToLabware: PropTypes.func.isRequired,
  currentLabware: PropTypes.shape({
    slot: PropTypes.number.isRequired
  }).isRequired
}

export default function ReviewPrompt (props) {
  // TODO: refactor based off of Button.js updated from Mike
  const {currentLabware, moveToLabware} = props
  return (
    <section className={styles.review_message}>
      <p>
        Before entering Labware Setup, check that your labware is positioned correctly in the deck slots as illustrated above.
      </p>
      <Button
        style={styles.btn_calibrate}
        onClick={moveToLabware}>
        CONTINUE MOVING TO {currentLabware.type} IN SLOT {currentLabware.slot}
      </Button>
    </section>
  )
}
