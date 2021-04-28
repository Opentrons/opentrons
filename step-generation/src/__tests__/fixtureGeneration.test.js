// @flow
import { createEmptyLiquidState } from '../utils'
import { makeContext, makeState } from '../__fixtures__'

describe('snapshot tests', () => {
  it('makeContext', () => {
    expect(makeContext()).toMatchSnapshot()
  })
  it('makeState', () => {
    expect(
      makeState({
        invariantContext: makeContext(),
        labwareLocations: {
          tiprack1Id: { slot: '1' },
          tiprack2Id: { slot: '2' },
          sourcePlateId: { slot: '4' },
          trashId: { slot: '12' },
        },
        pipetteLocations: { p300SingleId: { mount: 'left' } },
        tiprackSetting: { tiprack1Id: true, tiprack2Id: false },
      })
    ).toMatchSnapshot()
  })
  it('createEmptyLiquidState', () => {
    expect(createEmptyLiquidState(makeContext())).toMatchSnapshot()
  })
})
