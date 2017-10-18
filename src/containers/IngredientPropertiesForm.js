import { connect } from 'react-redux'
import { editIngredient, editModeIngredientGroup } from '../actions'
import { selectors } from '../reducers'
import IngredientPropertiesForm from '../components/IngredientPropertiesForm.js'

export default connect(
  state => ({
    numWellsSelected: selectors.numWellsSelected(state),
    ...selectors.selectedIngredientProperties(state)
  }),
  {
    onSave: editIngredient,
    onCancel: () => editModeIngredientGroup(null) // call with no args
  }
)(IngredientPropertiesForm)
