// robot actions tests
import { connect, disconnect } from '../actions'

describe('robot actions', () => {
  it('should create a robot:CONNECT action', () => {
    const expected = {
      type: 'robot:CONNECT',
      payload: { name: 'ot' },
    }

    expect(connect('ot')).toEqual(expected)
  })

  it('should create a robot:DISCONNECT action', () => {
    const expected = {
      type: 'robot:DISCONNECT',
    }

    expect(disconnect()).toEqual(expected)
  })
})
