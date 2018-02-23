import {ingredients, ingredLocations} from '../reducers'

const ingredientsInitialState = {}

describe('DELETE_INGREDIENT action', () => {
  const deleteGroup3 = {
    type: 'DELETE_INGREDIENT',
    payload: {groupId: 3}
  }

  test('delete ingredient by ingredient group id, when group id does NOT exist', () => {
    expect(ingredients(
      ingredientsInitialState,
      deleteGroup3
    )).toEqual({})

    expect(ingredLocations(
      ingredientsInitialState,
      deleteGroup3
    )).toEqual({})
  })

  test('delete ingredient by ingredient group id, when id does exist', () => {
    const prevIngredState = {
      '2': 'blaah',
      '3': {
        name: 'Buffer',
        wellDetailsByLocation: null,
        volume: 100,
        concentration: '50 mol/ng',
        description: '',
        individualize: false
      },
      '4': 'blah'
    }

    const prevLocationsState = {
      '2': { container1Id: ['A1', 'A2'] },
      '3': { container1Id: ['A1', 'B1', 'C1'] },
      '4': { container1Id: ['C1', 'C2'] }
    }

    expect(ingredients(
      prevIngredState,
      deleteGroup3
    )).toEqual({
      '2': 'blaah',
      '4': 'blah'
    })

    expect(ingredLocations(
      prevLocationsState,
      deleteGroup3
    )).toEqual({
      '2': { container1Id: ['A1', 'A2'] },
      '4': { container1Id: ['C1', 'C2'] }
    })
  })
})

describe('COPY_LABWARE action', () => {
  test('copy ingredient locations from cloned container', () => {
    const copyLabwareAction = {
      type: 'COPY_LABWARE',
      payload: {fromContainer: 'myTrough', toContainer: 'newContainer', toSlot: 'A3'}
    }

    const prevIngredState = {
      '3': {
        name: 'Buffer',
        wellDetailsByLocation: null,
        volume: 100,
        concentration: '50 mol/ng',
        description: '',
        individualize: false
      },
      '4': {
        name: 'Other Ingred',
        wellDetailsByLocation: null,
        volume: 10,
        concentration: '100%',
        description: '',
        individualize: false
      }
    }

    const prevLocationsState = {
      '3': {
        myTrough: ['A1', 'B1', 'C1'],
        otherContainer: ['D4', 'E4']
      },
      '4': {
        otherContainer: ['A4', 'B4']
      }
    }

    expect(ingredients(
      prevIngredState,
      copyLabwareAction
    )).toEqual(prevIngredState)

    expect(ingredLocations(
      prevLocationsState,
      copyLabwareAction
    )).toEqual({
      '3': {
        myTrough: ['A1', 'B1', 'C1'],
        newContainer: ['A1', 'B1', 'C1'], // <-- new
        otherContainer: ['D4', 'E4']
      },
      '4': {
        otherContainer: ['A4', 'B4']
      }
    })
  })
})

describe('EDIT_INGREDIENT action', () => {
  const ingredFields = {
    name: 'Cool Ingredient',
    serializeName: null,
    volume: 250,
    description: 'far out!',
    individualize: false
  }

  test('new ingredient', () => {
    const newIngredAction = {
      type: 'EDIT_INGREDIENT',
      payload: {
        ...ingredFields,
        groupId: '0',
        containerId: 'container1Id',
        wells: ['A1', 'A2', 'A3']
      }
    }

    expect(ingredients(
      {},
      newIngredAction)
    ).toEqual({
      '0': {...ingredFields}
    })

    expect(ingredLocations(
      {},
      newIngredAction
    )).toEqual({
      '0': {
        container1Id: ['A1', 'A2', 'A3']
      }
    })
  })

  test.skip('edit ingredient', () => {
    // TODO
  })

  test('copy ingredient without any changes', () => {
    const copyIngredAction = {
      type: 'EDIT_INGREDIENT',
      payload: {
        ...ingredFields,
        containerId: 'container1Id',
        groupId: 0,
        copyGroupId: 0,
        isUnchangedClone: true,
        wells: ['B1', 'B2'] // new wells
      }
    }

    const prevIngredState = {
      0: {...ingredFields}
    }

    expect(ingredients(
      prevIngredState,
      copyIngredAction
    )).toEqual({
      0: {...ingredFields} // no new ingredient group created
    })

    const prevLocationsState = {
      0: {
        container1Id: ['A1', 'A2', 'A3']
      }
    }

    expect(ingredLocations(
      prevLocationsState,
      copyIngredAction
    )).toEqual({
      0: {
        container1Id: ['A1', 'A2', 'A3', 'B1', 'B2']
      }
    })
  })

  test.skip('copy ingredient with changes', () => {
    // TODO
  })
})
