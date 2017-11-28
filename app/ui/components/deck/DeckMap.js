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
  const deck = labware.map((lab) => {
    // disable the link if the labware is a non-tiprack and tipracks haven't
    // been confirmed OR if the labware is a confirmed tiprack
    const isDisabled = (
      (!lab.isTiprack && !tipracksConfirmed) ||
      (lab.isTiprack && lab.confirmed)
    )

    return (
      <LabwareItem
        {...lab}
        key={lab.slot}
        slot={lab.slot}
        isDisabled={isDisabled}
        labwareReviewed={labwareReviewed}>
        {lab.slot}
      </LabwareItem>
    )
  })

  return (
    <div className={styles.deck}>
      {deck}
    </div>
  )
}
