import React from 'react'

import { slotnames } from '../constants.js'
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

const LabwareDropdown = ({onClose, selectLabwareToAdd}) => (
  <div className={styles.labwareDropdown}>
    <label>Labware Type</label>
    <div className='close' onClick={onClose}>X</div>
    <ul>
      <li>Tip Rack</li>
      <li>Tube Rack</li>
      <li>Well Plate ▼</li>
      <li><ul>
        <li onClick={e => selectLabwareToAdd('96-deep')}>96 Deep Well Plate</li>
        <li onClick={e => selectLabwareToAdd('96-tall')}>96 Well Plate (Tall)</li>
        <li onClick={e => selectLabwareToAdd('96-flat')}>96 Well Plate (Flat)</li>
      </ul></li>
      <li>PCR Strip</li>
      <li>And so</li>
      <li>on and so on</li>
    </ul>
  </div>
)

const Deck = ({loadedContainers, canAdd, modeLabwareSelection, openLabwareSelector, closeLabwareSelector, selectLabwareToAdd}) => (
  <div className={styles.deck}>
    {slotnames.map((slotName, i) =>
      <DeckSlot
        key={i}
        slotName={slotName}
        container={loadedContainers[slotName]}
      >
        {(slotName === canAdd) && (modeLabwareSelection
          ? <LabwareDropdown
            onClose={e => closeLabwareSelector({slotName})}
            selectLabwareToAdd={selectLabwareToAdd}
          />
          : <AddLabware onClick={e => openLabwareSelector({slotName})} />
        )}
      </DeckSlot>
    )}</div>
)

export default Deck
