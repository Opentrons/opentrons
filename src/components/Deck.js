import React from 'react'
// import cx from 'classnames'

import { slotnames } from '../constants.js'
import styles from '../css/style.css'

import LabwareDropdown from './LabwareDropdown.js'

import SelectablePlate from '../containers/SelectablePlate.js'
import IngredientsList from '../containers/IngredientsList.js'
import IngredientPropertiesForm from '../containers/IngredientPropertiesForm.js'

const AddLabware = props => (
  <div
    {...props}
    className={styles.addLabware}>
      Add Labware
  </div>
)

// TODO: use container component instead
const getPlateTopdownImg = containerName => {
  const getUrl = imageFileName => `https://s3.amazonaws.com/opentrons-images/website/labware/${imageFileName}.png`

  const plates96 = [
    '96-deep',
    '96-tall',
    '96-flat'
  ]

  const noImage = [
    '96-custom',
    'PCR-strip-tall'
  ]

  if (plates96.some(x => x === containerName)) {
    return getUrl('96-plate')
  }

  if (noImage.some(x => x === containerName)) {
    return getUrl('custom')
  }

  return getUrl(containerName)
}

const DeckSlot = ({slotName, container, children, onAddIngredientsClick, onRemoveContainerClick}) => (
  <div className={styles.deckSlot}>
    {container
      ? <img src={getPlateTopdownImg(container)} />
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
    createContainerAtSlot } = props

  return (
    <div className={styles.deck}>
      {activeModals.ingredientSelection && activeModals.ingredientSelection.slotName &&
        <div className={styles.ingredientModal}>

          <div className={styles.ingredientPanelSidebar}>
            <IngredientsList />
          </div>

          <div className={styles.ingredientPanelContent}>
            <div className={styles.containerDetail}>
              <SelectablePlate />
            </div>

            {/* <button>Add Ingredient</button> */}
            {/* TODO:  ^^^ Add button back in conditionally */}
            <IngredientPropertiesForm />
          </div>
          <div className='close' onClick={e => closeIngredientSelector()}>⟳</div>
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
              createContainerAtSlot={createContainerAtSlot}
            />
            : <AddLabware onClick={e => openLabwareSelector({slotName})} />
          )}
        </DeckSlot>
      )}
    </div>
  )
}

export default Deck
