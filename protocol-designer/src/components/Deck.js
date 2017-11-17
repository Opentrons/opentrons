import React from 'react'
// import cx from 'classnames'

import { slotnames } from '../constants.js'
import styles from '../css/style.css'

import SelectablePlate from '../containers/SelectablePlate.js'
import IngredientsList from '../containers/IngredientsList.js'
import IngredientPropertiesForm from '../containers/IngredientPropertiesForm.js'
import LabwareContainer from '../containers/LabwareContainer.js'

export default function Deck (props) {
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
        <div className={styles.ingredient_modal}>

          <div className={styles.ingredient_panel_sidebar}>
            <IngredientsList />
          </div>

          <div className={styles.ingredient_panel_content}>
            <div className={styles.top_bar}>
              <div className={styles.info}>Drag to select multiple wells</div>
              <div className={styles.close} onClick={e => closeIngredientSelector()}>
                <p>Back to Deck Map</p>
                <img src='https://s3-us-west-2.amazonaws.com/opentrons-protocol-designer/img/back.png' />
              </div>
            </div>
            <div className={styles.container_detail}>
              <SelectablePlate showLabels selectable />
            </div>

            {/* <button>Add Ingredient</button> */}
            {/* TODO:  ^^^ Add button back in conditionally */}
            <IngredientPropertiesForm />
          </div>
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
