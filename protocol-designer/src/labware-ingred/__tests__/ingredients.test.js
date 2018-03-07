import {ingredients, ingredLocations} from '../reducers'
import omit from 'lodash/omit'

describe('DELETE_INGREDIENT action', () => {
  const deleteGroup3 = {
    type: 'DELETE_INGREDIENT',
    payload: {groupId: 3}
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

  test('delete ingredient by ingredient group id, when id does exist', () => {
    const prevIngredState = {
      '2': 'blaah',
      '3': {
        name: 'Buffer',
        wellDetailsByLocation: null,
        concentration: '50 mol/ng',
        description: '',
        individualize: false
      },
      '4': 'blah'
    }

    const prevLocationsState = {
      '2': { container1Id: [
        {well: 'A1', volume: 123},
        {well: 'A2', volume: 123}
      ] },
      '3': { container1Id: [
        {well: 'A1', volume: 111},
        {well: 'B1', volume: 111},
        {well: 'C1', volume: 111}
      ] },
      '4': { container1Id: [
        {well: 'C1', volume: 100},
        {well: 'C2', volume: 100}
      ] }
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
      '2': { container1Id: [
        {well: 'A1', volume: 123},
        {well: 'A2', volume: 123}
      ] },
      // 3 is deleted
      '4': { container1Id: [
        {well: 'C1', volume: 100},
        {well: 'C2', volume: 100}
      ] }
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
        concentration: '50 mol/ng',
        description: '',
        individualize: false
      },
      '4': {
        name: 'Other Ingred',
        wellDetailsByLocation: null,
        concentration: '100%',
        description: '',
        individualize: false
      }
    }

    const prevLocationsState = {
      '3': {
        myTrough: [
          {well: 'A1', volume: 101},
          {well: 'B1', volume: 102},
          {well: 'C1', volume: 103}
        ],
        otherContainer: [
          {well: 'D4', volume: 201},
          {well: 'E4', volume: 202}
        ]
      },
      '4': {
        otherContainer: [
          {well: 'A4', volume: 301},
          {well: 'B4', volume: 302}
        ]
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
        myTrough: [
          {well: 'A1', volume: 101},
          {well: 'B1', volume: 102},
          {well: 'C1', volume: 103}
        ],
        newContainer: [ // this is newly copied
          {well: 'A1', volume: 101},
          {well: 'B1', volume: 102},
          {well: 'C1', volume: 103}
        ],
        otherContainer: [
          {well: 'D4', volume: 201},
          {well: 'E4', volume: 202}
        ]
      },
      '4': {
        otherContainer: [
          {well: 'A4', volume: 301},
          {well: 'B4', volume: 302}
        ]
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

  const resultingIngred = omit(ingredFields, ['volume'])

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
      '0': {...resultingIngred}
    })

    expect(ingredLocations(
      {},
      newIngredAction
    )).toEqual({
      '0': {
        container1Id: [
          {well: 'A1', volume: 250},
          {well: 'A2', volume: 250},
          {well: 'A3', volume: 250}
        ]
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
      0: {...resultingIngred}
    }

    expect(ingredients(
      prevIngredState,
      copyIngredAction
    )).toEqual({
      0: {...resultingIngred} // no new ingredient group created
    })

    const prevLocationsState = {
      0: {
        container1Id: [
          {well: 'A1', volume: 250},
          {well: 'A2', volume: 250},
          {well: 'A3', volume: 250}
        ]
      }
    }

    expect(ingredLocations(
      prevLocationsState,
      copyIngredAction
    )).toEqual({
      0: {
        container1Id: [
          {well: 'A1', volume: 250},
          {well: 'A2', volume: 250},
          {well: 'A3', volume: 250},
          {well: 'B1', volume: 250},
          {well: 'B2', volume: 250}
        ]
      }
    })
  })

  test.skip('copy ingredient with changes', () => {
    // TODO
  })
})
