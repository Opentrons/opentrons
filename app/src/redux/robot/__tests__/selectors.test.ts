// robot selectors test
import { setIn } from '@thi.ng/paths'
import { selectors } from '../'

import type { State } from '../../types'

describe('robot selectors', () => {
  describe('robot list', () => {
    let state: State

    beforeEach(() => {
      state = {
        robot: { connection: { connectedTo: 'bar' } },
      } as any
    })

    it('getConnectedRobotName', () => {
      expect(selectors.getConnectedRobotName(state)).toEqual('bar')
      state = setIn(state, 'robot.connection.connectedTo', 'foo')
      expect(selectors.getConnectedRobotName(state)).toEqual('foo')
    })
  })
})
