import { containers } from '../reducers'

const containersInitialState = {}

describe('DELETE_CONTAINER action', () => {
  test('no-op with no containers', () => {
    expect(containers(
      containersInitialState,
      {
        type: 'DELETE_CONTAINER',
        payload: {containerId: '123'},
      }
    )).toEqual(containersInitialState)
  })

  test('no-op with nonexistent containerId', () => {
    expect(containers(
      {
        '1': 'blah',
        '999': 'blaaah',
      },
      {
        type: 'DELETE_CONTAINER',
        payload: {containerId: '123'},
      }
    )).toEqual({
      '1': 'blah',
      '999': 'blaaah',
    })
  })

  test('delete given containerId', () => {
    expect(containers(
      {
        '1': 'blah',
        '123': 'delete this',
        '999': 'blaaah',
      },
      {
        type: 'DELETE_CONTAINER',
        payload: {containerId: '123'},
      }
    )).toEqual({
      '1': 'blah',
      '999': 'blaaah',
    })
  })
})

// TODO: BC 2018-7-25 test MOVE_LABWARE
describe.skip('COPY_LABWARE action', () => {
  test('copy correct container', () => {
    expect(containers(
      {
        clonePlate: {
          id: 'clonePlate',
          type: '96-flat',
          name: 'Samples Plate',
          slot: '1',
          disambiguationNumber: 1,
        },
        otherPlate: {
          id: 'otherPlate',
          type: '384-flat',
          name: 'Destination Plate',
          slot: '2',
          disambiguationNumber: 1,
        },
      },
      {
        type: 'COPY_LABWARE',
        payload: {fromContainer: 'clonePlate', toContainer: 'newContainer', toSlot: '5'},
      }
    )).toEqual({
      clonePlate: {
        id: 'clonePlate',
        type: '96-flat',
        name: 'Samples Plate',
        slot: '1',
        disambiguationNumber: 1,
      },
      newContainer: {
        id: 'newContainer',
        type: '96-flat',
        name: 'Samples Plate',
        slot: '5',
        disambiguationNumber: 2,
      },
      otherPlate: {
        id: 'otherPlate',
        type: '384-flat',
        name: 'Destination Plate',
        slot: '2',
        disambiguationNumber: 1,
      },
    })
  })
})
