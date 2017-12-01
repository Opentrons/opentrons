import React from 'react'

import { slotnames } from '../constants.js'
import styles from '../css/style.css'

import LabwareContainer from '../containers/LabwareContainer.js'
import IngredientSelectionModal from '../components/IngredientSelectionModal.js'

export default function Deck (props) {
  const {
    activeModals,
    closeIngredientSelector
  } = props

  return (
    <div className={styles.deck}>

      {activeModals.ingredientSelection && activeModals.ingredientSelection.slotName &&
        <IngredientSelectionModal onClose={closeIngredientSelector} />
      }

      {/* The actual deck, just a bunch of LabwareContainer containers */}
      {slotnames.map((slotName, i) =>
        <LabwareContainer
          key={i}
          slotName={slotName}
        />
      )}
    </div>
  )
}
