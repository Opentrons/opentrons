import { describe, expect, it } from 'vitest'

import { moveToAddressableAreaForDropTip } from '../commandCreators/atomic'
import { getSuccessResult } from '../fixtures'

const getRobotInitialState = (): any => {
  return {}
}
const mockId = 'mockId'
const invariantContext: any = {
  pipetteEntities: {
    [mockId]: {
      name: 'p50_single_flex',
      id: mockId,
    },
  },
}

describe('moveToAddressableAreaForDropTip', () => {
  it('should call moveToAddressableAreaForDropTip with correct params', () => {
    const robotInitialState = getRobotInitialState()
    const mockName = 'movableTrashA3'
    const result = moveToAddressableAreaForDropTip(
      { pipetteId: mockId, addressableAreaName: mockName },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'moveToAddressableAreaForDropTip',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          addressableAreaName: mockName,
          offset: { x: 0, y: 0, z: 0 },
          alternateDropLocation: true,
        },
      },
    ])
  })
})
