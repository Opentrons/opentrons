// @flow
import * as React from 'react'

import { SLOT_WIDTH, SLOT_HEIGHT } from '../constants.js'
import styles from './IngredientSelectionModal.css'

import SelectablePlate from '../containers/SelectablePlate.js'
// import IngredientsList from '../containers/IngredientsList.js'
import IngredientPropertiesForm from '../containers/IngredientPropertiesForm.js'

type Props = {
  visible: boolean
}

export default function IngredientSelectionModal (props: Props) {
  const {visible} = props
  if (!visible) return null

  return (
    <div className={styles.ingredient_modal}>

      <IngredientPropertiesForm />

      <div className={styles.container_detail}>
        <svg width='100%' height='100%' viewBox={`0 0 ${SLOT_WIDTH} ${SLOT_HEIGHT}`}>
          <SelectablePlate showLabels selectable />
        </svg>
      </div>
    </div>
  )
}
