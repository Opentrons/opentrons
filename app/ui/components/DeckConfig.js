import React from 'react'
import PropTypes from 'prop-types'
import Labware from './Labware'
import styles from './DeckConfig.css'

DeckMap.propTypes = {
  tipracksConfirmed: PropTypes.bool.isRequired,
  labwareReviewed: PropTypes.bool.isRequired,
  labware: PropTypes.arrayOf(PropTypes.shape({
    slot: PropTypes.number.isRequired
  })).isRequired
}

function DeckMap (props) {
  const {tipracksConfirmed, labwareReviewed} = props

  const labware = props.labware.map((lab) => (<Labware
    {...lab}
    key={lab.slot}
    isDisabled={!lab.isTiprack && tipracksConfirmed}
    labwareReviewed={labwareReviewed}
  />))

  return (
    <div className={styles.deck}>
      {labware}
    </div>
  )
}

LabwareNotification.propTypes = {
  isMoving: PropTypes.bool.isRequired,
  isOverWell: PropTypes.bool.isRequired
}

function LabwareNotification (props) {
  const {isMoving, isOverWell} = props

  if (isMoving) {
    return <RobotIsMovingPrompt />
  } else if (isOverWell) {
    return <ConfirmCalibrationPrompt {...props} />
  } else {
    return <BeginCalibrationPrompt />
  }
}

function BeginCalibrationPrompt () {
  return (
    <div className={styles.prompt}>
      <h3>Some labware is selected.</h3>
      <p>Click [Move To Well] to initiate calibration sequence.</p>
      <button
        className={styles.robot_action}
        onClick={() => console.log('move to slot action, needs slot from state/route?')}
      >
        Move To Well A1
      </button>
    </div>
  )
}

function RobotIsMovingPrompt () {
  return (
    <div className={styles.prompt}>
      <h3>Robot Moving To [slot] well A1</h3>
    </div>
  )
}

function ConfirmCalibrationPrompt (props) {
  const {currentLabware} = props

  if (!currentLabware) return null

  return (
    <div className={styles.prompt}>
      <h3>Is Pipette accurately centered over {currentLabware.slot} A1?</h3>
      <button
        className={styles.confirm}
        onClick={() => console.log('advance to next labware')}
      >
        Yes
      </button>
      <button
        className={styles.btn_modal}
        onClick={() => console.log('open jog modal')}
      >
        No
      </button>
    </div>
  )
}

DeckConfig.propTypes = {
  labwareReviewed: PropTypes.bool.isRequired,
  setLabwareReviewed: PropTypes.func.isRequired
}

export default function DeckConfig (props) {
  const {labwareReviewed, setLabwareReviewed} = props
  const deckMap = (<DeckMap {...props} />)

  if (!labwareReviewed) {
    return (
      <section className={styles.review_deck}>
        {deckMap}
        <div className={styles.review_message}>
          <p>
            To begin labware setup, position your tipracks and
            dry containers on designated deck slots as illustrated above.
          </p>
          <button className={styles.continue} onClick={setLabwareReviewed}>
            Continue
          </button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className={styles.deck_calibration}>
        {deckMap}
      </div>
      <LabwareNotification {...props} />
    </section>
  )
}
