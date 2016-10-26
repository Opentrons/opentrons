import app_mutations from '../../../../app/renderer/src/store/mutations'
const { mutations } = app_mutations

import * as types from '../../../../app/renderer/src/store/mutation-types'

import { expect } from 'chai'


describe('mutations', () => {
  it(types.UPDATE_ROBOT_CONNECTION, () => {
    // mock state
    const state = {is_connected: false, port: null}

    let payload = {is_connected: true, port: 'COM3'}

    const { UPDATE_ROBOT_CONNECTION } = mutations

    console.log('mutation obj', mutations)
    // console.log('access via dot', mutations.UPDATE_ROBOT_CONNECT)
    // console.log('access via desctruct', UPDATE_ROBOT_CONNECT)
    // console.log('access via desctruct', mutations['UPDATE_ROBOT_CONNECT'])

    // apply mutation
    UPDATE_ROBOT_CONNECTION(state, payload)

    // assert result
    // expect(state.port).toBe(payload.port)
    expect(state.port).to.equal(payload.port)
    // expect(state.is_connected).to.equal(payload.is_connected)
  })
})
