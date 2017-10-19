import { connect } from 'react-redux'

import { selectors } from '../reducers'
import { editModeIngredientGroup, deleteIngredientGroup } from '../actions'

import IngredientsList from '../components/IngredientsList.js'

export default connect(
  state => {
    const activeModals = selectors.activeModals(state)
    return {
      slotName: activeModals.ingredientSelection.slotName,
      containerName: activeModals.ingredientSelection.containerName,
      containerType: activeModals.ingredientSelection.containerName, // TODO name vs type
      ingredients: selectors.ingredientsForContainer(state)
    }
  },
  {
    editModeIngredientGroup,
    deleteIngredientGroup
  }
)(IngredientsList)
