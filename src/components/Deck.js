import React from 'react'
// import cx from 'classnames'

import { slotnames } from '../constants.js'
import styles from '../css/style.css'

import SelectablePlate from '../containers/SelectablePlate.js'
import IngredientsList from '../containers/IngredientsList.js'
import IngredientPropertiesForm from '../containers/IngredientPropertiesForm.js'
import LabwareContainer from '../containers/LabwareContainer.js'

const Deck = props => {
  const {
    // loadedContainers,
    activeModals,
    // openIngredientSelector,
    // deleteContainer,
    closeIngredientSelector
  } = props

  return (
    <div className={styles.deck}>

      {/* Ingredient selection modal. TODO: move out of Deck to Home... */}
      {activeModals.ingredientSelection && activeModals.ingredientSelection.slotName &&
        <div className={styles.ingredientModal}>

          <div className={styles.ingredientPanelSidebar}>
            <IngredientsList />
          </div>

          <div className={styles.ingredientPanelContent}>
            <div className={styles.containerDetail}>
              <SelectablePlate showLabels />
            </div>

            {/* <button>Add Ingredient</button> */}
            {/* TODO:  ^^^ Add button back in conditionally */}
            <IngredientPropertiesForm />
          </div>
          <div className='close' onClick={e => closeIngredientSelector()}>⟳</div>
        </div>
      }
      {/* The actual deck */}
      {slotnames.map((slotName, i) =>
        <LabwareContainer
          key={i}
          slotName={slotName}
        />
      )}
    </div>
  )
}

export default Deck
