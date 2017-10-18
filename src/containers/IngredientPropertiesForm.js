import { connect } from 'react-redux'
import { selectors } from '../reducers'
import IngredientPropertiesForm from '../components/IngredientPropertiesForm.js'

export default connect(
  state => ({
    numWellsSelected: selectors.numWellsSelected(state),
    // TODO don't use the following TESTING HACK
    name: 'Sample',
    volume: 10,
    description: '...',

    // TODO: move to actions
    onSave: ({name, volume, description}) => console.log('TODO: save', {name, volume, description}),
    onCancel: e => console.log('TODO: cancel add ingredients')
  }),
  {
  }
)(IngredientPropertiesForm)
