import { connect } from 'react-redux'
import { editIngredient } from '../actions'
import { selectors } from '../reducers'
import IngredientPropertiesForm from '../components/IngredientPropertiesForm.js'

export default connect(
  state => ({
    numWellsSelected: selectors.numWellsSelected(state),
    // TODO don't keep the following TESTING HACK
    // ...selectors.selectedIngredientProperties(state),

    // TODO: move to actions
    // onSave: ({name, volume, description}) => console.log('TODO: save', {name, volume, description}),
    onCancel: e => console.log('TODO: cancel add ingredients')
  }),
  {
    onSave: editIngredient
  }
)(IngredientPropertiesForm)
