import React from 'react'
import PropTypes from 'prop-types'
import LabwareItem from './LabwareItem'
import styles from './deck.css'

DeckMap.propTypes = {
  labwareReviewed: PropTypes.bool.isRequired,
  labware: PropTypes.arrayOf(PropTypes.shape({
    slot: PropTypes.number.isRequired
  })).isRequired,
  tipracksConfirmed: PropTypes.bool.isRequired
}

export default function DeckMap (props) {
  const {labware, tipracksConfirmed, labwareReviewed} = props
  const deck = labware.map((lab) => (<LabwareItem
    {...lab}
    key={lab.slot}
    slot={lab.slot}
    isDisabled={!lab.isTiprack && !tipracksConfirmed}
    labwareReviewed={labwareReviewed}
    >
    {lab.slot}
  </LabwareItem>))
  return (
    <div className={styles.deck}>
      {deck}
    </div>
  )
}
