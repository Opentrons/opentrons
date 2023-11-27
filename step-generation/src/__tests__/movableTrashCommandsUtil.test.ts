import {
  getInitialRobotStateStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
} from '../fixtures'
import { movableTrashCommandsUtil } from '../utils/movableTrashCommandsUtil'
import type { InvariantContext, RobotState, PipetteEntities } from '../types'

jest.mock('../getNextRobotStateAndWarnings/dispenseUpdateLiquidState')

const mockTrashBinId = 'mockTrashBinId'
const mockId = 'mockId'
const args = {
  pipetteId: mockId,
  volume: 10,
  flowRate: 10,
}
const mockPipEntities: PipetteEntities = {
  [mockId]: {
    name: 'p50_single_flex',
    id: mockId,
  },
} as any
const mockCutout = 'cutoutA3'
const mockMoveToAddressableArea = {
  commandType: 'moveToAddressableArea',
  key: expect.any(String),
  params: {
    pipetteId: mockId,
    addressableAreaName: 'movableTrashA3',
  },
}

describe('movableTrashCommandsUtil', () => {
  let invariantContext: InvariantContext
  let initialRobotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    invariantContext = {
      ...invariantContext,
      pipetteEntities: mockPipEntities,
      additionalEquipmentEntities: {
        [mockTrashBinId]: {
          name: 'trashBin',
          location: mockCutout,
          id: mockTrashBinId,
        },
      },
    }
  })
  it('returns correct commands for dispensing', () => {
    const result = movableTrashCommandsUtil(
      { ...args, type: 'dispense' },
      invariantContext,
      initialRobotState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      mockMoveToAddressableArea,
      {
        commandType: 'dispenseInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          volume: 10,
          flowRate: 10,
        },
      },
    ])
  })
  it('returns correct commands for blow out', () => {
    const result = movableTrashCommandsUtil(
      {
        ...args,
        type: 'blowOut',
      },
      invariantContext,
      initialRobotState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      mockMoveToAddressableArea,
      {
        commandType: 'blowOutInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          flowRate: 10,
        },
      },
    ])
  })
  it('returns correct commands for drop tip', () => {
    initialRobotState.tipState.pipettes[mockId] = true
    const result = movableTrashCommandsUtil(
      {
        ...args,
        type: 'dropTip',
      },
      invariantContext,
      initialRobotState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      mockMoveToAddressableArea,
      {
        commandType: 'dropTipInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
        },
      },
    ])
  })
  it('returns correct commands for aspirate in place (air gap)', () => {
    initialRobotState.tipState.pipettes[mockId] = true
    const result = movableTrashCommandsUtil(
      {
        ...args,
        type: 'airGap',
      },
      invariantContext,
      initialRobotState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      mockMoveToAddressableArea,
      {
        commandType: 'aspirateInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          volume: 10,
          flowRate: 10,
        },
      },
    ])
  })
  it('returns correct commands for aspirate in place', () => {
    initialRobotState.tipState.pipettes[mockId] = true
    const result = movableTrashCommandsUtil(
      {
        ...args,
        type: 'aspirate',
      },
      invariantContext,
      initialRobotState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      mockMoveToAddressableArea,
      {
        commandType: 'aspirateInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          volume: 10,
          flowRate: 10,
        },
      },
    ])
  })
  it('returns no pip attached error', () => {
    const result = movableTrashCommandsUtil(
      {
        pipetteId: 'badPip',
        type: 'dispense',
      },
      invariantContext,
      initialRobotState
    )
    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({ type: 'PIPETTE_DOES_NOT_EXIST' })
  })
  it('returns no waste chute attached error', () => {
    invariantContext = {
      ...invariantContext,
      additionalEquipmentEntities: {},
    }
    const result = movableTrashCommandsUtil(
      {
        ...args,
        type: 'dispense',
      },
      invariantContext,
      initialRobotState
    )
    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'ADDITIONAL_EQUIPMENT_DOES_NOT_EXIST',
    })
  })
})
