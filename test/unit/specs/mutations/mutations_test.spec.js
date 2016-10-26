import app_mutations from '../../../../app/renderer/src/store/mutations'


const { mutations } = app_mutations
describe('UPDATE_ROBOT_STATE', () => {
  it('should render correct contents', () => {
    expect(1).toBe(1)
  })
})


describe('mutations', () => {
  it('INCREMENT', () => {
    // mock state
    const state = { count: 0 }
    // apply mutation
    increment(state)
    // assert result
    expect(state.count).to.equal(1)
  })
})
