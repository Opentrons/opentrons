import React from 'react'
import { SLOT_WIDTH, SLOT_HEIGHT } from '../constants.js'
import styles from './IngredientSelectionModal.css'

import SelectablePlate from '../containers/SelectablePlate.js'
import IngredientsList from '../containers/IngredientsList.js'
import IngredientPropertiesForm from '../containers/IngredientPropertiesForm.js'

export default function IngredientSelectionModal ({onClose, visible}) {
  if (!visible) return null

  return (
    <div className={styles.ingredient_modal}>

      <div className={styles.ingredient_panel_sidebar}>
        <IngredientsList />
      </div>

      <div className={styles.ingredient_panel_content}>
        <div className={styles.top_bar}>
          <div className={styles.info}>Drag to select multiple wells</div>
          <div className={styles.close} onClick={e => onClose()}>
            <p>Back to Deck Map</p>
            <img src='https://s3-us-west-2.amazonaws.com/opentrons-protocol-designer/img/back.png' />
          </div>
        </div>
        <div className={styles.container_detail}>
          <svg width='100%' height='100%' viewBox={`0 0 ${SLOT_WIDTH} ${SLOT_HEIGHT}`}>
            <SelectablePlate showLabels selectable />
          </svg>
        </div>

        <IngredientPropertiesForm />
      </div>
    </div>
  )
}
