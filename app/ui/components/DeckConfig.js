import React from 'react'
import Labware from './Labware'
import styles from './DeckConfig.css'

const DeckMap = (props) => {
  const {
    deck
  } = props
  const deckMap = deck.map((lab) => {
    return <Labware key={lab.slot} {...lab} {...props} />
  })
  return (
    <div className={styles.deck}>
      {deckMap}
    </div>
  )
}

const LabwareNotification = (props) => {
  const {isMoving, isOverWell} = props
  if (isMoving) {
    return <RobotIsMovingPrompt />
  } else if (isOverWell) {
    return <ConfirmCalibrationPrompt />
  } else {
    return <BeginCalibrationPrompt />
  }
}

const BeginCalibrationPrompt = () => {
  return (
    <div className={styles.prompt}>
      <h3>Some labware is selected.</h3>
      <p>Click [Move To Well] to initiate calibration sequence.</p>
      <button
        className={styles.robot_action}
        onClick={console.log('move to slot action, needs slot from state/route?')}
      >
        Move To Well A1
      </button>
    </div>
  )
}

const RobotIsMovingPrompt = () => {
  return (
    <div className={styles.prompt}>
      <h3>Robot Moving To [slot] well A1</h3>
    </div>
  )
}

const ConfirmCalibrationPrompt = () => {
  return (
    <div className={styles.prompt}>
      <h3>Is Pipette accurately centered over well/tip A1?</h3>
      <button
        className={styles.confirm}
        onClick={() => console.log('advance to next labware')}
      >
        Yes
      </button>
      <button
        className={styles.confirm}
        onClick={() => console.log('open jog modal')}
      >
        No
      </button>
    </div>
  )
}

export default function DeckConfig (props) {
  const {isDeckmapReviewed} = props

  if (!isDeckmapReviewed) {
    return (
      <section className={styles.review_deck}>
        <DeckMap {...props} />
        <div className={styles.review_message}>
          <p>To begin labware setup, position your tipracks and
          dry containers on designated deck slots as illustrated above.</p>
          <button className={styles.continue}>Continue</button>
        </div>
      </section>
    )
  } else {
    return (
      <section>
        <div className={styles.deck_calibration}>
          <DeckMap {...props} />
        </div>
        <LabwareNotification {...props} />
      </section>
    )
  }
}
