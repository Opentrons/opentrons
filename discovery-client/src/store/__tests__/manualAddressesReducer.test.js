// @flow
import * as Actions from '../actions'
import { reducer, manualAddressesReducer } from '../reducer'

describe('manual addresses reducer', () => {
  it('should return an empty initial array under manualAddresses in the root reducer', () => {
    const state = reducer(undefined, ({}: any))
    expect(state.manualAddresses).toEqual([])
  })

  it('should not overwrite state if a "client:INITIALIZE_STATE" action has no manualAddresses', () => {
    const initialState = [{ ip: '127.0.0.1', port: 31950 }]
    const action = Actions.initializeState({})
    const state = manualAddressesReducer(initialState, action)

    expect(state).toBe(initialState)
  })

  it('should overwrite state with addresses from "client:INITIALIZE_STATE"', () => {
    const initialState = [{ ip: '127.0.0.1', port: 31950 }]

    const action = Actions.initializeState({
      manualAddresses: [
        { ip: '127.0.0.2', port: 31950 },
        { ip: '127.0.0.3', port: 31950 },
      ],
    })
    const state = manualAddressesReducer(initialState, action)

    expect(state).toEqual([
      { ip: '127.0.0.2', port: 31950 },
      { ip: '127.0.0.3', port: 31950 },
    ])
  })
})
