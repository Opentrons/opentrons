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
  labware: PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    slot: PropTypes.number.isRequired
  }),
  isMoving: PropTypes.bool.isRequired,
  isOverWell: PropTypes.bool.isRequired,
  moveToContainer: PropTypes.func.isRequired,
  setLabwareConfirmed: PropTypes.func.isRequired
}

function LabwareNotification (props) {
  const {
    labware,
    isMoving,
    isOverWell,
    moveToContainer,
    setLabwareConfirmed
  } = props

  if (!labware) return null
  if (isMoving) return (<RobotIsMovingPrompt />)
  if (isOverWell) {
    return (
      <ConfirmCalibrationPrompt
        {...props}
        onYesClick={setLabwareConfirmed(labware.slot)}
      />
    )
  }

  return (
    <BeginCalibrationPrompt
      {...labware}
      onClick={moveToContainer(labware.slot)}
    />
  )
}

function BeginCalibrationPrompt (props) {
  const {name, type, slot, isConfirmed, onClick} = props

  const title = isConfirmed
    ? `${name} (${type}, slot ${slot}, confirmed)`
    : `${name} (${type}, slot ${slot})`

  const message = isConfirmed
    ? 'Click [Move To Well] to initiate calibration sequence again.'
    : 'Click [Move To Well] to initiate calibration sequence'

  return (
    <div className={styles.prompt}>
      <h3>{title}</h3>
      <p>{message}</p>
      <button className={styles.robot_action} onClick={onClick}>
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

ConfirmCalibrationPrompt.propTypes = {
  labware: PropTypes.shape({
    slot: PropTypes.number.isRequired
  }).isRequired,
  onYesClick: PropTypes.func.isRequired
}

function ConfirmCalibrationPrompt (props) {
  const {labware, onYesClick} = props

  return (
    <div className={styles.prompt}>
      <h3>
        {`Is Pipette accurately centered over slot ${labware.slot} A1 well?`}
      </h3>
      <button
        className={styles.confirm}
        onClick={onYesClick}
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
  setLabwareReviewed: PropTypes.func.isRequired,
  currentLabware: PropTypes.object,
  currentLabwareConfirmation: PropTypes.object.isRequired,
  moveToContainer: PropTypes.func.isRequired,
  setLabwareConfirmed: PropTypes.func.isRequired
}

export default function DeckConfig (props) {
  const {
    labwareReviewed,
    setLabwareReviewed,
    currentLabware,
    currentLabwareConfirmation,
    moveToContainer,
    setLabwareConfirmed
  } = props

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
      <LabwareNotification
        {...currentLabwareConfirmation}
        labware={currentLabware}
        moveToContainer={moveToContainer}
        setLabwareConfirmed={setLabwareConfirmed}
      />
    </section>
  )
}
