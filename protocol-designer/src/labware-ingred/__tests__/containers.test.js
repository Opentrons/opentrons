import { containers } from '../reducers'
jest.mock('../../labware-defs/utils')

const containersInitialState = {}

describe('DELETE_CONTAINER action', () => {
  it('no-op with no containers', () => {
    expect(
      containers(containersInitialState, {
        type: 'DELETE_CONTAINER',
        payload: { labwareId: '123' },
      })
    ).toEqual(containersInitialState)
  })

  it('no-op with nonexistent labwareId', () => {
    expect(
      containers(
        {
          '1': 'blah',
          '999': 'blaaah',
        },
        {
          type: 'DELETE_CONTAINER',
          payload: { labwareId: '123' },
        }
      )
    ).toEqual({
      '1': 'blah',
      '999': 'blaaah',
    })
  })

  it('delete given labwareId', () => {
    expect(
      containers(
        {
          '1': 'blah',
          '123': 'delete this',
          '999': 'blaaah',
        },
        {
          type: 'DELETE_CONTAINER',
          payload: { labwareId: '123' },
        }
      )
    ).toEqual({
      '1': 'blah',
      '999': 'blaaah',
    })
  })
})

describe('DUPLICATE_LABWARE action', () => {
  it('duplicate correct labware', () => {
    expect(
      containers(
        {
          clonePlate: { nickname: 'Samples Plate' },
          otherPlate: { nickname: 'Destination Plate' },
        },
        {
          type: 'DUPLICATE_LABWARE',
          payload: {
            templateLabwareId: 'clonePlate',
            duplicateLabwareId: 'newContainer',
            duplicateLabwareNickname: 'Samples Plate (1)',
            toSlot: '5',
          },
        }
      )
    ).toEqual({
      clonePlate: { nickname: 'Samples Plate' },
      newContainer: { nickname: 'Samples Plate (1)' },
      otherPlate: { nickname: 'Destination Plate' },
    })
  })
})
