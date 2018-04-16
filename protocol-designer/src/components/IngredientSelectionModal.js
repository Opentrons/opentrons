// @flow
import * as React from 'react'
import IngredientPropertiesForm from '../containers/IngredientPropertiesForm.js'
import SingleLabware from './SingleLabware'
import panelModalStyles from './panelModal.css'

type Props = {
  visible: boolean
}

export default function IngredientSelectionModal (props: Props) {
  const {visible} = props
  if (!visible) return null

  return (
    <div className={panelModalStyles.panel_modal}>
      <IngredientPropertiesForm />

      <SingleLabware />
    </div>
  )
}
