import React from 'react'
// import cx from 'classnames'

import { slotnames } from '../constants.js'
import styles from '../css/style.css'

import LabwareDropdown from './LabwareDropdown.js'

import SelectablePlate from '../containers/SelectablePlate.js'
import IngredientsList from '../containers/IngredientsList.js'
import IngredientPropertiesForm from '../containers/IngredientPropertiesForm.js'
import LabwareContainer from '../containers/LabwareContainer.js'

const AddLabware = props => (
  <div
    {...props}
    className={styles.addLabware}>
      Add Labware
  </div>
)

const Deck = props => {
  const {
    // loadedContainers,
    canAdd,
    activeModals,
    // openIngredientSelector,
    closeIngredientSelector,
    // deleteContainer,
    openLabwareSelector,
    closeLabwareSelector,
    createContainer } = props

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
        <LabwareContainer
          key={i}
          slotName={slotName}
        >
          {(slotName === canAdd) && (activeModals.labwareSelection
            ? <LabwareDropdown
              onClose={e => closeLabwareSelector({slotName})}
              createContainer={createContainer}
            />
            : <AddLabware onClick={e => openLabwareSelector({slotName})} />
          )}
        </LabwareContainer>
      )}
    </div>
  )
}

export default Deck
