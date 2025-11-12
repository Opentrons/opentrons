import { beforeEach, describe, expect, it } from 'vitest'

import { getInitialRobotStateStandard, makeContext } from '../../fixtures'
import { getIsSlotOccupied } from '../stackerUtils'

describe('getIsSlotOccupied', () => {
  const invariantContext = makeContext()
  const robotState = getInitialRobotStateStandard(invariantContext)

  beforeEach(() => {})

  it('getIsSlotOccupied gets a labware occupied slot', () => {
    const slotOccupied = getIsSlotOccupied(robotState, { slotName: '1' })
    expect(slotOccupied).toBe(true)
  })

  it('getIsSlotOccupied gets a labware not occupied slot', () => {
    const slotOccupied = getIsSlotOccupied(robotState, { slotName: '6' })
    expect(slotOccupied).toBe(false)
  })
})
