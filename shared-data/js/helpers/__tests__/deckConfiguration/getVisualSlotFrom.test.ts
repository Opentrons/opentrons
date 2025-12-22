import { describe, expect, it } from 'vitest'

import { getVisualSlotIdFromAAId } from '../../deckConfiguration/getVisualSlotFrom'

describe('getVisualSlotIdFromAAId', () => {
  it('should get VSD4 for flexStackerModuleV1D4', () => {
    const vs = getVisualSlotIdFromAAId('flexStackerModuleV1D4')
    expect(vs).toEqual('VSD4')
  })

  it('should get VSD3 for D3', () => {
    const vs = getVisualSlotIdFromAAId('D3')
    expect(vs).toEqual('VSD3')
  })
})
