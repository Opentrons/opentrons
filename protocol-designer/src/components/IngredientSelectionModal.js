// @flow
import * as React from 'react'

import { SLOT_WIDTH, SLOT_HEIGHT } from '../constants.js'
import styles from './IngredientSelectionModal.css'

import SelectablePlate from '../containers/SelectablePlate.js'
// import IngredientsList from '../containers/IngredientsList.js'
import IngredientPropertiesForm from '../containers/IngredientPropertiesForm.js'

type Props = {
  onClose: () => void,
  visible: boolean
}

export default function IngredientSelectionModal (props: Props) {
  const {onClose, visible} = props
  if (!visible) return null

  return (
    <div className={styles.ingredient_modal}>

      {/* TODO Ian 2018-02-21 Remove this, add this functionality to Header */}
      <div style={{float: 'right', color: 'red'}}>
        <div onClick={() => onClose()}>
          <p>Back to Deck Map</p>
        </div>
      </div>

      <IngredientPropertiesForm />

      <div className={styles.container_detail}>
        <svg width='100%' height='100%' viewBox={`0 0 ${SLOT_WIDTH} ${SLOT_HEIGHT}`}>
          <SelectablePlate showLabels selectable />
        </svg>
      </div>
    </div>
  )
}
