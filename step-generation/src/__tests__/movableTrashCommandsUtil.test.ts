import { describe, it, expect, vi } from 'vitest'
import { getInitialRobotStateStandard, makeContext } from '../fixtures'
import { curryCommandCreator } from '../utils'
import { movableTrashCommandsUtil } from '../utils/movableTrashCommandsUtil'
import {
  aspirateInPlace,
  blowOutInPlace,
  dispenseInPlace,
  dropTipInPlace,
  moveToAddressableArea,
  moveToAddressableAreaForDropTip,
} from '../commandCreators/atomic'
import type { PipetteEntities } from '../types'

vi.mock('../getNextRobotStateAndWarnings/dispenseUpdateLiquidState')
vi.mock('../utils/curryCommandCreator')

const mockTrashBinId = 'mockTrashBinId'
const mockId = 'mockId'

const mockPipEntities: PipetteEntities = {
  [mockId]: {
    name: 'p50_single_flex',
    id: mockId,
  },
} as any
const mockCutout = 'cutoutA3'
const mockMoveToAddressableAreaParams = {
  pipetteId: mockId,
  addressableAreaName: 'movableTrashA3',
}
const invariantContext = makeContext()

const args = {
  pipetteId: mockId,
  volume: 10,
  flowRate: 10,
  invariantContext: {
    ...invariantContext,
    pipetteEntities: mockPipEntities,
    additionalEquipmentEntities: {
      [mockTrashBinId]: {
        name: 'trashBin' as const,
        location: mockCutout,
        id: mockTrashBinId,
      },
    },
  },
  prevRobotState: getInitialRobotStateStandard(invariantContext),
}

describe('movableTrashCommandsUtil', () => {
  it('returns correct commands for dispensing', () => {
    movableTrashCommandsUtil({ ...args, type: 'dispense' })
    expect(curryCommandCreator).toHaveBeenCalledWith(
      moveToAddressableArea,
      mockMoveToAddressableAreaParams
    )
    expect(curryCommandCreator).toHaveBeenCalledWith(dispenseInPlace, {
      pipetteId: mockId,
      volume: 10,
      flowRate: 10,
    })
  })
  it('returns correct commands for blow out', () => {
    movableTrashCommandsUtil({
      ...args,
      type: 'blowOut',
    })
    expect(curryCommandCreator).toHaveBeenCalledWith(
      moveToAddressableArea,
      mockMoveToAddressableAreaParams
    )
    expect(curryCommandCreator).toHaveBeenCalledWith(blowOutInPlace, {
      pipetteId: mockId,

      flowRate: 10,
    })
  })
  it('returns correct commands for drop tip', () => {
    movableTrashCommandsUtil({
      ...args,
      type: 'dropTip',
      prevRobotState: {
        ...args.prevRobotState,
        tipState: { pipettes: { [mockId]: true } } as any,
      },
    })
    expect(curryCommandCreator).toHaveBeenCalledWith(
      moveToAddressableAreaForDropTip,
      mockMoveToAddressableAreaParams
    )
    expect(curryCommandCreator).toHaveBeenCalledWith(dropTipInPlace, {
      pipetteId: mockId,
    })
  })
  it('returns correct commands for aspirate in place (air gap)', () => {
    movableTrashCommandsUtil({
      ...args,
      type: 'airGap',
      prevRobotState: {
        ...args.prevRobotState,
        tipState: { pipettes: { [mockId]: true } } as any,
      },
    })
    expect(curryCommandCreator).toHaveBeenCalledWith(
      moveToAddressableArea,
      mockMoveToAddressableAreaParams
    )
    expect(curryCommandCreator).toHaveBeenCalledWith(aspirateInPlace, {
      pipetteId: mockId,
      volume: 10,
      flowRate: 10,
    })
  })
})
