import {selectors} from '../reducers'

// FIXTURES

const baseIngredFields = {
  groupId: '0',
  name: 'Some Ingred',
  description: null,
  individualize: false,
  serializeName: null
}

const baseIngredFields2 = {
  groupId: '1',
  name: 'Second Ingred',
  description: 'Nice',
  individualize: false,
  serializeName: null
}

const containerState = {
  'default-trash': {
    type: 'trash-box',
    name: 'Trash',
    slot: '12'
  },
  container1Id: {
    slot: '10',
    type: '96-flat',
    name: 'Labware 1'
  },
  container2Id: {
    slot: '8',
    type: '96-deep-well',
    name: 'Labware 2'
  },
  container3Id: {
    slot: '9',
    type: 'tube-rack-2ml',
    name: 'Labware 3'
  }
}

const baseStateXXSingleIngred = {
  containers: containerState,

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

const baseStateXXTwoIngred = {
  containers: containerState,

  ingredients: {
    '0': baseIngredFields,
    '1': baseIngredFields2
  },

  ingredLocations: {
    '0': {
      container1Id: {
        A1: {volume: 100},
        B1: {volume: 150}
      },
      container2Id: {
        A2: {volume: 105},
        B2: {volume: 155}
      }
    },
    '1': {
      container2Id: {
        H1: {volume: 111}
      },
      container3Id: {
        H2: {volume: 222}
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

const ingredsByLabwareXXSingleIngred = {
  'container1Id': {
    '0': {
      ...baseIngredFields,
      wells: {
        A1: {volume: 100},
        B1: {volume: 150}
      }
    }
  },
  'container2Id': {},
  'container3Id': {},
  'default-trash': {}
}

const ingredsByLabwareXXTwoIngred = {
  container1Id: {
    '0': {
      ...baseIngredFields,
      wells: {
        A1: {volume: 100},
        B1: {volume: 150}
      }
    }
  },
  container2Id: {
    '0': {
      ...baseIngredFields,
      wells: {
        A2: {volume: 105},
        B2: {volume: 155}
      }
    },
    '1': {
      ...baseIngredFields2,
      wells: {
        H1: {volume: 111}
      }
    }
  },
  container3Id: {
    '1': {
      ...baseIngredFields2,
      wells: {
        H2: {volume: 222}
      }
    }
  },
  'default-trash': {}
}

const defaultWellContents = {
  highlighted: false,
  hovered: false,
  preselected: false,
  selected: false,
  groupId: null
}

const container1MaxVolume = 400

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

describe('ingredientsByLabware', () => {
  test('selects ingredients by labware: single ingred case', () => {
    expect(
      selectors.ingredientsByLabware.resultFunc(
        baseStateXXSingleIngred.containers,
        baseStateXXSingleIngred.ingredients,
        baseStateXXSingleIngred.ingredLocations
      )
    ).toEqual(ingredsByLabwareXXSingleIngred)
  })

  test('selects ingredients by labware: two ingred case', () => {
    expect(
      selectors.ingredientsByLabware.resultFunc(
        baseStateXXTwoIngred.containers,
        baseStateXXTwoIngred.ingredients,
        baseStateXXTwoIngred.ingredLocations
      )
    ).toEqual(ingredsByLabwareXXTwoIngred)
  })
})

describe('wellContentsAllLabware', () => {
  const singleIngredResult = selectors.wellContentsAllLabware.resultFunc(
    containerState, // all labware
    ingredsByLabwareXXSingleIngred,
    {containerId: 'container1Id'}, // selected labware
    {preselected: {}, selected: {A1: 'A1', B1: 'B1'}}, // selected
    {A3: 'A3'} // highlighted (TODO: is this used?)
  )

  // TODO: 2nd test case
  // const twoIngredResult = selectors.wellContentsAllLabware.resultFunc(
  //   containerState, // all labware
  //   ingredsByLabwareXXTwoIngred,
  //   containerState.container2Id, // selected labware
  //   {preselected: {}, selected: {A1: 'A1', B1: 'B1'}}, // selected
  //   {A3: 'A3'} // highlighted (TODO: is this used?)
  // )

  test('container has expected number of wells', () => {
    expect(Object.keys(singleIngredResult.container1Id).length).toEqual(96)
  })

  test('selects well contents of all labware (for Plate props)', () => {
    expect(
      singleIngredResult
    ).toMatchObject({
      'default-trash': {
        A1: defaultWellContents
      },
      container2Id: {
        A1: defaultWellContents
      },
      container3Id: {
        A1: defaultWellContents
      },

      container1Id: {
        A1: {
          ...defaultWellContents,
          selected: true,
          groupId: '0',
          maxVolume: container1MaxVolume
        },
        A2: {
          ...defaultWellContents,
          maxVolume: container1MaxVolume
        },
        B1: {
          ...defaultWellContents,
          selected: true,
          groupId: '0',
          maxVolume: container1MaxVolume
        },
        B2: {
          ...defaultWellContents,
          maxVolume: container1MaxVolume
        }
      }
    })
  })
})
