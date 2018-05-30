// @flow
import * as React from 'react'

import SingleLabware from './SingleLabware'
import styles from './IngredientSelectionModal.css'

import SelectablePlate from '../containers/SelectablePlate'
import IngredientPropertiesForm from '../containers/IngredientPropertiesForm'
import LabwareNameEditForm from '../containers/LabwareNameEditForm'
import WellSelectionInstructions from './WellSelectionInstructions'

type Props = {}

export default function IngredientSelectionModal (props: Props) {
  return (
    <div className={styles.ingredient_modal}>

      <IngredientPropertiesForm />
      <LabwareNameEditForm />

      <SingleLabware>
        <SelectablePlate showLabels selectable />
      </SingleLabware>

      <WellSelectionInstructions />
    </div>
  )
}
