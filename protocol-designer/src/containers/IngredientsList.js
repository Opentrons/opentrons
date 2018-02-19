import { connect } from 'react-redux'

import { selectors } from '../labware-ingred/reducers'
import { editModeIngredientGroup, deleteIngredient } from '../labware-ingred/actions'

import IngredientsList from '../components/IngredientsList.js'

export default connect(
  state => {
    const activeModals = selectors.activeModals(state)
    const container = selectors.selectedContainer(state)

    console.log('selectedContainer', container)

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
