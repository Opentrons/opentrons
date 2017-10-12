import React from 'react'
// import cx from 'classnames'

import { slotnames } from '../constants.js'
import styles from '../css/style.css'

import SelectablePlate from '../containers/SelectablePlate.js'

const AddLabware = props => (
  <div
    {...props}
    className={styles.addLabware}>
      Add Labware
  </div>
)

// TODO: move to utils
const getImg = containerName => {
  const nameToImg = {
    '96-deep': '96-plate',
    '96-tall': '96-plate',
    '96-flat': '96-plate',
    'trough-12row': 'trough-12row',
    'tube-rack-2ml': 'tube-rack-2ml',
    'trash-box': 'trash-box'
    // TODO: add the rest
  }
  return 'https://s3.amazonaws.com/opentrons-images/website/labware/' +
    (nameToImg[containerName] || 'custom') +
    '.png'
}

const DeckSlot = ({slotName, container, children, onAddIngredientsClick, onRemoveContainerClick}) => (
  <div className={styles.deckSlot}>
    {container
      ? <img src={getImg(container)} />
      : <label>{slotName}</label>}

    {container &&
      <div className={styles.containerOverlay}>
        <div className={styles.containerOverlayAddIngred} onClick={onAddIngredientsClick}>
          Add Ingredients
        </div>
        <div className={styles.containerOverlayRemove} onClick={onRemoveContainerClick}>
          Remove {container}
        </div>
      </div>}

    {children}
  </div>
)

const LabwareDropdown = ({onClose, selectLabwareToAdd}) => (
  <div className={styles.labwareDropdown}>
    <label>Labware Type</label>
    <div className='close' onClick={onClose}>X</div>
    <ul>
      <li>Tip Rack</li>
      <li>Tube Rack ▼</li>
      <li><ul>
        <li onClick={e => selectLabwareToAdd('tube-rack-2ml')}>2mL Tube Rack</li>
      </ul></li>
      <li>Well Plate ▼</li>
      <li><ul>
        <li onClick={e => selectLabwareToAdd('96-deep')}>96 Deep Well Plate</li>
        <li onClick={e => selectLabwareToAdd('96-tall')}>96 Well Plate (Tall)</li>
        <li onClick={e => selectLabwareToAdd('96-flat')}>96 Well Plate (Flat)</li>
        <li onClick={e => selectLabwareToAdd('96-custom')}>96 Well Plate (CUSTOM)</li>
      </ul></li>
      <li>PCR Strip</li>
      <li>And so</li>
      <li>on and so on</li>
    </ul>
  </div>
)

const Deck = props => {
  const {
    loadedContainers,
    canAdd,
    activeModals,
    openIngredientSelector,
    closeIngredientSelector,
    deleteContainerAtSlot,
    openLabwareSelector,
    closeLabwareSelector,
    selectLabwareToAdd } = props

  return (
    <div className={styles.deck}>
      {activeModals.ingredientSelection &&
        <div className={styles.ingredientModal}>

          <div className={styles.ingredientPanelSidebar}>
            <label>
              <div>Slot {activeModals.ingredientSelection.slotName}</div>
              <div>Container {activeModals.ingredientSelection.containerName}</div>
            </label>

            {/* Each section is a detail view of 1 ingredient */}
            <section>
              <label>
                <div className={styles.ingredLabel}>Sample 1</div>
                <div className='circle' style={{backgroundColor: 'red'}} />
                <div className={styles.editButton}>EDIT</div>
                <div className={styles.deleteIngredient}>✕</div>
              </label>
              <div className={styles.ingredientInlineDetail}>
                <div>
                  <label>A1</label>
                  <input placeholder='20' />
                </div>
                <div>
                  <label>B1</label>
                  <input placeholder='20' />
                </div>
                <div>
                  <label>C1</label>
                  <input placeholder='20' />
                </div>
              </div>
            </section>
          </div>

          <div className={styles.ingredientPanelContent}>
            <div className={styles.containerDetail}>
              <SelectablePlate />
            </div>

            {/* <button>Add Ingredient</button> */}
            {/* TODO:  ^^^ Add button back in conditionally */}
            <div className={styles.ingredientPropertiesEntry}>
              <h1>
                <div>Ingredient Properties</div>
                <div>(TODO) Well(s) Selected</div>
              </h1>
              <form>
                <span>
                  <label>Name</label>
                  <input />
                </span>
                <span>
                  <label>Volume</label> (µL)
                  <input />
                </span>
                <span>
                  <label>Description</label>
                  <textarea />
                </span>
              </form>
              <div className={styles.ingredientPropRightSide}>
                <span>
                  <label>Color Swatch</label>
                  <div className={styles.circle} style={{backgroundColor: 'red'}} />
                </span>
                <button>Save</button>
                <button>Cancel</button>
              </div>
            </div>
          </div>
          <div className='close' onClick={e => closeIngredientSelector()}>➡</div>
        </div>
      }
      {slotnames.map((slotName, i) =>
        <DeckSlot
          key={i}
          slotName={slotName}
          container={loadedContainers[slotName]}
          onAddIngredientsClick={e => openIngredientSelector({slotName})}
          onRemoveContainerClick={e => deleteContainerAtSlot(slotName)}
        >
          {(slotName === canAdd) && (activeModals.labwareSelection
            ? <LabwareDropdown
              onClose={e => closeLabwareSelector({slotName})}
              selectLabwareToAdd={selectLabwareToAdd}
            />
            : <AddLabware onClick={e => openLabwareSelector({slotName})} />
          )}
        </DeckSlot>
      )}
    </div>
  )
}

export default Deck
