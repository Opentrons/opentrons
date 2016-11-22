import { expect } from 'chai'

import * as types from 'renderer/store/mutation-types'
import app_mutations from 'renderer/store/mutations'
const { mutations } = app_mutations


describe('mutations', () => {
  it(types.UPDATE_ROBOT_CONNECTION, () => {
    // mock state
    const state = {is_connected: false, port: null}

    // apply mutation
    let payload = {is_connected: true, port: 'COM3'}
    mutations[types.UPDATE_ROBOT_CONNECTION](state, payload)

    // assert result
    expect(state.port).to.equal(payload.port)
    expect(state.is_connected).to.equal(payload.is_connected)
  })
})
