import { createEmptyLiquidState } from '../utils'
import { makeContext, makeState } from '../fixtures'
describe('snapshot tests', () => {
  it('makeContext', () => {
    expect(makeContext()).toMatchSnapshot()
  })
  it('makeState', () => {
    expect(
      makeState({
        invariantContext: makeContext(),
        labwareLocations: {
          tiprack1Id: {
            slot: '1',
          },
          tiprack2Id: {
            slot: '2',
          },
          sourcePlateId: {
            slot: '4',
          },
          tiprack4AdapterId: {
            slot: '7',
          },
          tiprack5AdapterId: {
            slot: '8',
          },
          tiprack4Id: {
            slot: 'tiprack4AdapterId',
          },
          tiprack5Id: {
            slot: 'tiprack5AdapterId',
          },
          fixedTrash: {
            slot: '12',
          },
        },
        pipetteLocations: {
          p300SingleId: {
            mount: 'left',
          },
        },
        tiprackSetting: {
          tiprack1Id: true,
          tiprack2Id: false,
        },
      })
    ).toMatchSnapshot()
  })
  it('createEmptyLiquidState', () => {
    expect(createEmptyLiquidState(makeContext())).toMatchSnapshot()
  })
})
