// @flow
import { connect } from 'react-redux'
import { editIngredient, editModeIngredientGroup, deleteIngredient } from '../labware-ingred/actions'
import { selectors } from '../labware-ingred/reducers'
import IngredientPropertiesForm from '../components/IngredientPropertiesForm.js'
import type {BaseState} from '../types'

export default connect(
  (state: BaseState) => ({
    numWellsSelected: selectors.numWellsSelected(state),
    selectedWellsMaxVolume: selectors.selectedWellsMaxVolume(state),
    allIngredientNamesIds: selectors.allIngredientNamesIds(state),
    allIngredientGroupFields: selectors.allIngredientGroupFields(state)
  }),
  {
    onSave: editIngredient,
    onCancel: () => editModeIngredientGroup(null), // call with no args
    onDelete: (groupId: string) => deleteIngredient({groupId})
  }
)(IngredientPropertiesForm)
