// @flow
import { connect } from 'react-redux'
import { selectors } from '../labware-ingred/reducers'
import { editModeIngredientGroup, deleteIngredient } from '../labware-ingred/actions'
import type {BaseState} from '../types'

import IngredientsList from '../components/IngredientsList.js'

export default connect(
  (state: BaseState) => {
    const activeModals = selectors.activeModals(state)
    const container = selectors.selectedContainer(state)

    return {
      slot: activeModals.ingredientSelection.slot,
      containerName: container && container.name,
      containerType: container && container.type,
      ingredients: selectors.ingredientsForContainer(state),
      selectedIngredientGroupId: selectors.selectedIngredientGroupId(state)
    }
  },
  {
    editModeIngredientGroup,
    deleteIngredient
  }
)(IngredientsList)
