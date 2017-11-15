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
