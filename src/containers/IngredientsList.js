import { connect } from 'react-redux'

import { selectors } from '../reducers'
import { editIngredientGroup } from '../actions'

import IngredientsList from '../components/IngredientsList.js'

export default connect(
  state => {
    const activeModals = selectors.activeModals(state)
    return {
      slotName: activeModals.ingredientSelection.slotName,
      containerName: activeModals.ingredientSelection.containerName,
      containerType: activeModals.ingredientSelection.containerName,
      ingredients: [
        {
          name: 'Blood Samples',

          wells: ['C2', 'C3', 'C4'],
          wellDetails: {
            C3: { volume: 100, concentration: 10, name: 'Special Sample' }
          },

          volume: 20, // required. in uL
          concentration: null, // optional number, a %
          description: 'blah', // optional string

          individualized: true // when false, ignore wellDetails
          // (we should probably delete wellDetails if individualized is set false -> true)
        },
        {
          name: 'Control',
          wells: ['A1'],
          wellDetails: null,
          volume: 50,
          concentration: null,
          description: '',
          individualized: false
        },
        {
          name: 'Buffer',
          wells: ['H1', 'H2', 'H3', 'H4'],
          wellDetails: null,
          volume: 100,
          concentration: 50,
          description: '',
          individualized: false
        }
      ]
    }
  },
  {
    editIngredientGroup
  }
)(IngredientsList)
