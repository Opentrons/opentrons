import React from 'react'
import styles from '../css/style.css'

import SelectablePlate from '../containers/SelectablePlate.js'
import IngredientsList from '../containers/IngredientsList.js'
import IngredientPropertiesForm from '../containers/IngredientPropertiesForm.js'

export default function IngredientSelectionModal ({onClose}) {
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
          <SelectablePlate showLabels selectable />
        </div>

        <IngredientPropertiesForm />
      </div>
    </div>
  )
}
