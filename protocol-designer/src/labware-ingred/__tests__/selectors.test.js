import {selectors} from '../reducers'

// FIXTURES

const baseIngredFields = {
  groupId: '0',
  name: 'Some Ingred',
  description: null,
  individualize: false,
  serializeName: null
}

const allIngredientsXXSingleIngred = {
  '0': {
    ...baseIngredFields,

    instances: {
      'container1Id': {
        A1: {
          volume: 100
        },
        B1: {
          volume: 150
        }
      }
    }
  }
}

// ==============================

describe('allIngredientNamesIds selector', () => {
  test('selects names & ids from allIngredients selector result', () => {
    expect(
      selectors.allIngredientNamesIds.resultFunc(allIngredientsXXSingleIngred)
    ).toEqual([{
      ingredientId: '0',
      name: 'Some Ingred'
    }])
  })
})

describe('allIngredientGroupFields', () => {
  test('no ingreds - return empty obj', () => {
    expect(
      selectors.allIngredientGroupFields.resultFunc({})
    ).toEqual({})
  })

  test('select fields from all ingred groups', () => {
    expect(
      selectors.allIngredientGroupFields.resultFunc(allIngredientsXXSingleIngred)
    ).toEqual({
      '0': {
        ...baseIngredFields
      }
    })
  })
})
