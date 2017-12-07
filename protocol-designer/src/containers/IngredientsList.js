import { connect } from 'react-redux'

import { selectors } from '../reducers'
import { editModeIngredientGroup, deleteIngredient } from '../actions'

import IngredientsList from '../components/IngredientsList.js'

export default connect(
  state => {
    const activeModals = selectors.activeModals(state)
    const container = selectors.selectedContainer(state)

    return {
      slotName: activeModals.ingredientSelection.slotName,
      containerName: container.name,
      containerType: container.type,
      ingredients: selectors.ingredientsForContainer(state),
      selectedIngredientGroupId: selectors.selectedIngredientGroupId(state)
    }
  },
  {
    editModeIngredientGroup,
    deleteIngredient
  }
)(IngredientsList)
