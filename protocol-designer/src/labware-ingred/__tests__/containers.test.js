import { containers } from '../reducers'

const containersInitialState = {}

describe('DELETE_CONTAINER action', () => {
  test('no-op with no containers', () => {
    expect(containers(
      containersInitialState,
      {
        type: 'DELETE_CONTAINER',
        payload: {containerId: '123'}
      }
    )).toEqual(containersInitialState)
  })

  test('no-op with nonexistent containerId', () => {
    expect(containers(
      {
        '1': 'blah',
        '999': 'blaaah'
      },
      {
        type: 'DELETE_CONTAINER',
        payload: {containerId: '123'}
      }
    )).toEqual({
      '1': 'blah',
      '999': 'blaaah'
    })
  })

  test('delete given containerId', () => {
    expect(containers(
      {
        '1': 'blah',
        '123': 'delete this',
        '999': 'blaaah'
      },
      {
        type: 'DELETE_CONTAINER',
        payload: {containerId: '123'}
      }
    )).toEqual({
      '1': 'blah',
      '999': 'blaaah'
    })
  })
})

describe('COPY_LABWARE action', () => {
  test('copy correct container', () => {
    expect(containers(
      {
        clonePlate: {
          type: '96-flat',
          name: 'Samples Plate',
          slotName: 'A2'
        },
        otherPlate: {
          type: '384-flat',
          name: 'Destination Plate',
          slotName: 'B2'
        }
      },
      {
        type: 'COPY_LABWARE',
        payload: {fromContainer: 'clonePlate', toContainer: 'newContainer', toSlot: 'A3'}
      }
    )).toEqual({
      clonePlate: {
        type: '96-flat',
        name: 'Samples Plate',
        slotName: 'A2'
      },
      newContainer: {
        type: '96-flat',
        name: 'Samples Plate',
        slotName: 'A3'
      },

      otherPlate: {
        type: '384-flat',
        name: 'Destination Plate',
        slotName: 'B2'
      }
    })
  })
})
