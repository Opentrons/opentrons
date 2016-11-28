import { expect } from 'chai'

import * as types from 'renderer/store/mutation-types'
import appMutations from 'renderer/store/mutations'
const { mutations } = appMutations

describe('mutations', () => {
  it(types.UPDATE_ROBOT_CONNECTION, () => {
    // mock state
    const state = {isConnected: false, port: null}

    // apply mutation
    let payload = {isConnected: true, port: 'COM3'}
    mutations[types.UPDATE_ROBOT_CONNECTION](state, payload)

    // assert result
    expect(state.port).to.equal(payload.port)
    expect(state.isConnected).to.equal(payload.isConnected)
  })
})
