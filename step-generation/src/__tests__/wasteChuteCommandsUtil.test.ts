import { WASTE_CHUTE_SLOT } from '@opentrons/shared-data'
import {
  getInitialRobotStateStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
} from '../fixtures'
import { wasteChuteCommandsUtil } from '../utils/wasteChuteCommandsUtil'
import type { InvariantContext, RobotState, PipetteEntities } from '../types'

const mockWasteChuteId = 'mockWasteChuteId'
const mockAddressableAreaName = 'mockName'
const mockId = 'mockId'
const args = {
  pipetteId: mockId,
  addressableAreaName: 'mockName',
  volume: 10,
  flowRate: 10,
}
const mockMoveToAddressableArea = {
  commandType: 'moveToAddressableArea',
  key: expect.any(String),
  params: {
    pipetteId: mockId,
    addressableAreaName: mockAddressableAreaName,
  },
}
const mockPipEntities: PipetteEntities = {
  [mockId]: {
    name: 'p50_single_flex',
    id: mockId,
  },
} as any

describe('wasteChuteCommandsUtil', () => {
  let invariantContext: InvariantContext
  let initialRobotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    invariantContext = {
      ...invariantContext,
      pipetteEntities: mockPipEntities,
      additionalEquipmentEntities: {
        [mockWasteChuteId]: {
          name: 'wasteChute',
          location: WASTE_CHUTE_SLOT,
          id: 'mockId',
        },
      },
    }
  })
  it('returns correct commands for dispensing', () => {
    const result = wasteChuteCommandsUtil(
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
    const result = wasteChuteCommandsUtil(
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
    const result = wasteChuteCommandsUtil(
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
  it('returns no pip attached error', () => {
    const result = wasteChuteCommandsUtil(
      {
        pipetteId: 'badPip',
        addressableAreaName: 'mockName',
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
    const result = wasteChuteCommandsUtil(
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
