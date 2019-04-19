// @flow
import { createEmptyLiquidState } from '../utils'
import { makeContext, makeState } from './fixtures'

describe('snapshot tests', () => {
  test('makeContext', () => {
    expect(makeContext()).toMatchSnapshot()
  })
  test('makeState', () => {
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
  test('createEmptyLiquidState', () => {
    expect(createEmptyLiquidState(makeContext())).toMatchSnapshot()
  })
})
