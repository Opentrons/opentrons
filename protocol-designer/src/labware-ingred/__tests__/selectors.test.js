import {selectors} from '../reducers'

// FIXTURES

const baseIngredFields = {
  groupId: '0',
  name: 'Some Ingred',
  serializeName: null,
  // concentration: null,
  description: null,
  individualize: false
}

const containersStateXXSingleIngred = {
  'default-trash': {
    id: 'default-trash',
    type: 'trash-box',
    name: 'Trash',
    slot: '12'
  },
  container1Id: {
    slot: '10',
    type: '96-flat',
    name: 'Labware 1'
  }
}

const labwareIngredStateXXSingleIngred = {
  ingredients: {
    '0': {
      ...baseIngredFields
    }
  },
  ingredLocations: {
    '0': {
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

describe('allIngredients selector', () => {
  test('combines ingredients and ingredLocations', () => {
    expect(
      selectors.allIngredients.resultFunc(labwareIngredStateXXSingleIngred)
    ).toEqual(allIngredientsXXSingleIngred)
  })
})

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

describe('ingredientsForContainer selector', () => {
  test('returns {} with no labware selected', () => {
    expect(
      selectors.ingredientsForContainer.resultFunc(
        allIngredientsXXSingleIngred,
        null
      )
    ).toEqual({})
  })

  test('returns {} when selected labware contains no ingreds', () => {
    expect(
      selectors.ingredientsForContainer.resultFunc(
        allIngredientsXXSingleIngred,
        {containerId: 'someEmptyContainerId'}
      )
    ).toEqual({})
  })

  test('gets all ingredient groups, for the currently selected labware', () => {
    expect(
      selectors.ingredientsForContainer.resultFunc(
        allIngredientsXXSingleIngred, // from allIngredients selector
        {containerId: 'container1Id'} // selected labware obj
      )
    ).toEqual({
      '0': {
        ...baseIngredFields,
        wells: {
          A1: {
            volume: 100
          },
          B1: {
            volume: 150
          }
        }
      }
    })
  })
})

describe('allWellMatricesById selector', () => {
  const result = selectors.allWellMatricesById.resultFunc(
    allIngredientsXXSingleIngred,
    containersStateXXSingleIngred
  )

  const baseWellData = {
    highlighted: false,
    preselected: false,
    selected: false,
    maxVolume: 400
  }

  test('A1 & B1 should have groupId 0', () => {
    expect(result.container1Id.A1).toEqual({
      ...baseWellData,
      wellName: 'A1',
      groupId: '0'
    })

    expect(result.container1Id.B1).toEqual({
      ...baseWellData,
      wellName: 'B1',
      groupId: '0'
    })
  })

  test('H12 should have no groupId', () => {
    // empty well
    expect(result.container1Id.H12).toEqual({
      ...baseWellData,
      wellName: 'H12'
    })
  })
})
