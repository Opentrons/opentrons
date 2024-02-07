import { describe, it, expect } from 'vitest'
import { selectors } from '../selectors'
// FIXTURES
const baseIngredFields = {
  groupId: '0',
  name: 'Some Ingred',
  description: null,
  serialize: false,
}
const allIngredientsXXSingleIngred = {
  '0': { ...baseIngredFields },
}
// ==============================
describe('allIngredientNamesIds selector', () => {
  it('selects names & ids from allIngredients selector result', () => {
    expect(
      // @ts-expect-error(sa, 2021-6-20): resultFunc not part of Selector type
      selectors.allIngredientNamesIds.resultFunc(
        // flow def for resultFunc is wrong and/or resultFun isn't typeable
        allIngredientsXXSingleIngred as any
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
    // @ts-expect-error(sa, 2021-6-20): resultFunc not part of Selector type
    expect(selectors.allIngredientGroupFields.resultFunc({} as any)).toEqual({})
  })
  it('select fields from all ingred groups', () => {
    expect(
      // @ts-expect-error(sa, 2021-6-20): resultFunc not part of Selector type
      selectors.allIngredientGroupFields.resultFunc(
        allIngredientsXXSingleIngred as any
      )
    ).toEqual({
      '0': { ...baseIngredFields },
    })
  })
})
