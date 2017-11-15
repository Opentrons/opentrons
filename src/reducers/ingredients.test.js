import { ingredients } from '../reducers'

const ingredientsInitialState = {}

describe('DELETE_INGREDIENT action', () => {
  test('delete ingredient by ingredient group id, when id does not exist', () => {
    expect(ingredients(
      ingredientsInitialState,
      {
        type: 'DELETE_INGREDIENT',
        payload: {groupId: 3}
      }
    )).toEqual({})
  })

  test('delete ingredient by ingredient group id, when id does exist', () => {
    const prevState = {
      '2': 'blaah',
      '3': {
        name: 'Buffer',
        locations: {
          'A1': ['H1', 'H2', 'H3', 'H4']
        },
        wellDetailsByLocation: null,
        volume: 100,
        concentration: '50 mol/ng',
        description: '',
        individualize: false
      },
      '4': 'blah'
    }

    expect(ingredients(
      prevState,
      {
        type: 'DELETE_INGREDIENT',
        payload: {groupId: '3'}
      }
    )).toEqual({
      '2': 'blaah',
      '4': 'blah'
    })
  })
})
