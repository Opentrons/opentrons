// @flow
import { selectors } from '../selectors'

// FIXTURES

const baseIngredFields = {
  groupId: '0',
  name: 'Some Ingred',
  description: null,
  serialize: false,
}

const allIngredientsXXSingleIngred = {
  '0': {
    ...baseIngredFields,
  },
}

// ==============================

describe('allIngredientNamesIds selector', () => {
  it('selects names & ids from allIngredients selector result', () => {
    expect(
      selectors.allIngredientNamesIds.resultFunc(
        // flow def for resultFunc is wrong and/or resultFun isn't typeable
        (allIngredientsXXSingleIngred: any)
      )
    ).toEqual([
      {
        ingredientId: '0',
        name: 'Some Ingred',
      },
    ])
  })
})

describe('allIngredientGroupFields', () => {
  it('no ingreds - return empty obj', () => {
    // flow def for resultFunc is wrong and/or resultFun isn't typeable
    expect(selectors.allIngredientGroupFields.resultFunc(({}: any))).toEqual({})
  })

  it('select fields from all ingred groups', () => {
    expect(
      selectors.allIngredientGroupFields.resultFunc(
        // flow def for resultFunc is wrong and/or resultFun isn't typeable
        (allIngredientsXXSingleIngred: any)
      )
    ).toEqual({
      '0': {
        ...baseIngredFields,
      },
    })
  })
})
