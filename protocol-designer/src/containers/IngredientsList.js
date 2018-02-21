// @flow
import {connect} from 'react-redux'
import {selectors} from '../labware-ingred/reducers'
import {editModeIngredientGroup, deleteIngredient} from '../labware-ingred/actions'
import type {BaseState} from '../types'

import IngredientsList, {type Props} from '../components/IngredientsList.js'

// TODO Ian 2018-02-21 Is there a nicer way to strip out keys from an object type?
type PropsWithoutActions = {
  ...Props,
  editModeIngredientGroup?: *,
  deleteIngredient?: *
}

function mapStateToProps (state: BaseState): PropsWithoutActions {
  // const activeModals = selectors.activeModals(state)
  // const container = selectors.selectedContainer(state)

  return {
    // slot: activeModals.ingredientSelection.slot || '1',
    // containerName: container ? container.name : 'No Name',
    // containerType: container ? container.type : 'No type',
    ingredients: selectors.ingredientsForContainer(state),
    selectedIngredientGroupId: selectors.selectedIngredientGroupId(state),
    selected: false
  }
}

function mapDispatchToProps (dispatch) {
  return {
    editModeIngredientGroup: (args) => dispatch(editModeIngredientGroup(args)),
    deleteIngredient: (args) => dispatch(deleteIngredient(args))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(IngredientsList)
