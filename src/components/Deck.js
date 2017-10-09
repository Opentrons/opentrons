import React from 'react'

import styles from '../css/style.css'

const AddLabware = props => (
  <div
    {...props}
    className={styles.addLabware}>
      Add Labware
  </div>
)

const DeckSlot = ({slotName, container, children}) => (
  <div className={styles.deckSlot}>
    {container || <label>{slotName}</label>}
    {children}
  </div>
)

const LabwareDropdown = (onClose) => (
  <div className={styles.labwareDropdown}>
    <label>Labware Type</label>
    <div className='close' onClick={onClose}>X</div>
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

const Deck = ({loadedContainers, canAdd, modeLabwareSelection, openLabwareDropdown, closeLabwareDropdown}) => {
  const slotnames = [
    'A3', 'B3', 'C3', 'D3', 'E3',
    'A2', 'B2', 'C2', 'D2', 'E2',
    'A1', 'B1', 'C1', 'D1', 'E1'
  ]

  return (
    <div className={styles.deck}>
      {slotnames.map((slotName, i) =>
        <DeckSlot
          key={i}
          slotName={slotName}
          container={loadedContainers[slotName]}
        >
          {(slotName === canAdd) && (modeLabwareSelection
            ? <LabwareDropdown onClose={e => closeLabwareDropdown({slotName})} />
            : <AddLabware onClick={e => { console.log('clicked add labware', e); openLabwareDropdown({slotName}) }} />
          )}
        </DeckSlot>
      )}</div>
  )
}

export default Deck
