import {ingredients, ingredLocations} from '../reducers'

describe('DELETE_INGREDIENT action', () => {
  const deleteGroup3 = {
    type: 'DELETE_INGREDIENT',
    payload: {groupId: 3},
  }

  test('delete ingredient by ingredient group id, when group id does NOT exist', () => {
    expect(ingredients(
      {},
      deleteGroup3
    )).toEqual({})

    expect(ingredLocations(
      {},
      deleteGroup3
    )).toEqual({})
  })

  test('delete all ingredients in well', () => {
    const deleteWellAction = {
      type: 'DELETE_INGREDIENT',
      payload: {well: 'C1'},
    }

    const prevIngredState = {
      '2': 'blaah',
      '3': {
        name: 'Buffer',
        wellDetailsByLocation: null,
        concentration: '50 mol/ng',
        description: '',
        serialize: false,
      },
      '4': 'blah',
    }

    const prevLocationsState = {
      '2': {
        container1Id: {
          A1: {volume: 123},
          A2: {volume: 123},
        },
      },
      '3': {
        container1Id: {
          A1: {volume: 111},
          B1: {volume: 112},
          C1: {volume: 113},
        },
      },
      '4': {
        container1Id: {
          C1: {volume: 100},
          C2: {volume: 100},
        },
      },
    }

    expect(ingredients(
      prevIngredState,
      deleteWellAction
    )).toEqual(prevIngredState)

    expect(ingredLocations(
      prevLocationsState,
      deleteWellAction
    )).toEqual({
      '2': {
        container1Id: {
          A1: {volume: 123},
          A2: {volume: 123},
        },
      },
      '3': {
        container1Id: {
          A1: {volume: 111},
          B1: {volume: 112},
          C1: {volume: 113},
        },
      },
      '4': {
        container1Id: {
          C1: {volume: 100},
          C2: {volume: 100},
        },
      },
    })
  })

  // TODO Ian 2018-06-07 rewrite this test when 'delete all ingreds in group' is re-implemented
  test.skip('delete ingredient by ingredient group id, when id does exist', () => {})
})

// TODO: BC 2018-7-24 test MOVE_LABWARE instead
describe.skip('COPY_LABWARE action', () => {
  test('copy ingredient locations from cloned container', () => {
    const copyLabwareAction = {
      type: 'COPY_LABWARE',
      payload: {fromContainer: 'myTrough', toContainer: 'newContainer', toSlot: '5'},
    }

    const prevIngredState = {
      ingred3: {
        name: 'Buffer',
        wellDetailsByLocation: null,
        concentration: '50 mol/ng',
        description: '',
        serialize: false,
      },
      ingred4: {
        name: 'Other Ingred',
        wellDetailsByLocation: null,
        concentration: '100%',
        description: '',
        serialize: false,
      },
    }

    const prevLocationsState = {
      myTrough: {
        A1: {ingred3: {volume: 101}},
        A2: {ingred3: {volume: 102}},
        A3: {ingred3: {volume: 103}},
      },
      otherContainer: {
        D4: {ingred3: {volume: 201}},
        E4: {ingred3: {volume: 202}},
        A4: {ingred4: {volume: 301}},
        B4: {ingred4: {volume: 302}},
      },
    }

    expect(ingredients(
      prevIngredState,
      copyLabwareAction
    )).toEqual(prevIngredState)

    expect(ingredLocations(
      prevLocationsState,
      copyLabwareAction
    )).toEqual({
      myTrough: {
        A1: {ingred3: {volume: 101}},
        A2: {ingred3: {volume: 102}},
        A3: {ingred3: {volume: 103}},
      },
      // this is newly copied
      newContainer: {
        A1: {ingred3: {volume: 101}},
        A2: {ingred3: {volume: 102}},
        A3: {ingred3: {volume: 103}},
      },
      otherContainer: {
        D4: {ingred3: {volume: 201}},
        E4: {ingred3: {volume: 202}},
        A4: {ingred4: {volume: 301}},
        B4: {ingred4: {volume: 302}},
      },
    })
  })
})
