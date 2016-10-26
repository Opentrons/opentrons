import app_mutations from '../app/renderer/src/store/mutations'
const { mutations } = app_mutations

import { expect } from 'chai'

/ destructure assign mutations
const { increment } = mutations

describe('mutations', () => {
  it('INCREMENT', () => {
    mock state
    const state = { count: 0 }
    // apply mutation
    increment(state)
    // assert result
    expect(state.count).to.equal(1)
  })
})
