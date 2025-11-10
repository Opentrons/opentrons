import { beforeEach, describe, expect, it } from 'vitest'
import {getIsSlotOccupied} from '../stackerUtils'
import { getInitialRobotStateStandard, makeContext } from '../../fixtures'

describe('getIsSlotOccupied' , () => {
    const invariantContext = makeContext()
    const robotState = getInitialRobotStateStandard(invariantContext)

    beforeEach(() => {

    })

    it('getIsSlotOccupied gets a labware occupied slot', () => {
        const slotOccupied = getIsSlotOccupied(robotState, '1')
        expect(slotOccupied).toBe(true)
    })

    it('getIsSlotOccupied gets a labware not occupied slot', () => {
        const slotOccupied = getIsSlotOccupied(robotState, '6')
        expect(slotOccupied).toBe(false)
    })
})