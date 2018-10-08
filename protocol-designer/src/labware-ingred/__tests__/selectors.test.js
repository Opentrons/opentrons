import {selectors} from '../reducers'

// FIXTURES

const baseIngredFields = {
  groupId: '0',
  name: 'Some Ingred',
  description: null,
  individualize: false,
}

const allIngredientsXXSingleIngred = {
  '0': {
    ...baseIngredFields,
  },
}

// ==============================

describe('allIngredientNamesIds selector', () => {
  test('selects names & ids from allIngredients selector result', () => {
    expect(
      selectors.allIngredientNamesIds.resultFunc(allIngredientsXXSingleIngred)
    ).toEqual([{
      ingredientId: '0',
      name: 'Some Ingred',
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
        ...baseIngredFields,
      },
    })
  })
})
