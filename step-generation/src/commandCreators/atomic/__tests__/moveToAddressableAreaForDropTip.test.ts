import { describe, expect, it } from 'vitest'

import { moveToAddressableAreaForDropTip } from '..'
import { getSuccessResult } from '../../../fixtures'

const mockId = 'mockId'
const mockTrashBinId = 'mockTrashBinId'
const invariantContext: any = {
  pipetteEntities: {
    [mockId]: {
      name: 'p50_single_flex',
      id: mockId,
      pythonName: 'mock_pipette',
    },
  },
  trashBinEntities: {
    [mockTrashBinId]: {
      id: mockTrashBinId,
      location: 'cutoutA3',
      pythonName: 'mock_trash_bin_1',
    },
  },
}

describe('moveToAddressableAreaForDropTip', () => {
  it('should call moveToAddressableAreaForDropTip with correct params', () => {
    const robotInitialState: any = {
      tipState: { pipettes: { [mockId]: { hasTip: true } } },
    }
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
    expect(res.python).toBe('mock_pipette.drop_tip(mock_trash_bin_1)')
  })

  it('should no-op if there is no tip', () => {
    const robotInitialState: any = {
      tipState: { pipettes: { [mockId]: { hasTip: false } } },
    }
    const result = moveToAddressableAreaForDropTip(
      { pipetteId: mockId, addressableAreaName: 'movableTrashA3' },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([])
    expect(res.python).toBeUndefined()
  })
})
