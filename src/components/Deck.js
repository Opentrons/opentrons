import React from 'react'

import styles from '../css/style.css'

const AddLabware = () => (
  <div
    onClick={e => console.log('TODO: addLabware action')}
    className={styles.addLabware}>
      Add Labware
  </div>
)

const DeckSlot = ({slotName}) => (
  <div className={styles.deckSlot}>
    <label>{slotName}</label>
    <AddLabware />
    {slotName === 'A1' && <LabwareDropdown />}
  </div>
)

const LabwareDropdown = () => (
  <div className={styles.labwareDropdown}>
    <label>Labware Type</label>
    <div className='close'>X</div>
    <ul>
      <li>Tip Rack</li>
      <li>Tube Rack</li>
      <li>Well Plate ▼</li>
      <li><ul>
        <li>96 Deep Well Plate</li>
        <li>96 Well Plate (Tall)</li>
        <li>96 Well Plate (Flat)</li>
      </ul></li>
      <li>PCR Strip</li>
      <li>And so</li>
      <li>on and so on</li>
    </ul>
  </div>
)

const Deck = () => {
  const slotnames = [
    'A3', 'B3', 'C3', 'D3', 'E3',
    'A2', 'B2', 'C2', 'D2', 'E2',
    'A1', 'B1', 'C1', 'D1', 'E1'
  ]

  return (
    <div className={styles.deck}>
      {slotnames.map((slotName, i) =>
        <DeckSlot key={i} slotName={slotName} />
      )}</div>
  )
}

export default Deck
