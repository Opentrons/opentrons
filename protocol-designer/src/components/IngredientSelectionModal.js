// @flow
import * as React from 'react'

import SingleLabware from './SingleLabware'
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

      <SingleLabware>
        <SelectablePlate showLabels selectable />
      </SingleLabware>
    </div>
  )
}
