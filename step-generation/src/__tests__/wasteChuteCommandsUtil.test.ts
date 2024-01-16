import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'
import { getInitialRobotStateStandard, makeContext } from '../fixtures'
import { curryCommandCreator } from '../utils'
import { wasteChuteCommandsUtil } from '../utils/wasteChuteCommandsUtil'
import type { PipetteEntities } from '../types'
import {
  aspirateInPlace,
  blowOutInPlace,
  dispenseInPlace,
  dropTipInPlace,
  moveToAddressableArea,
} from '../commandCreators/atomic'

jest.mock('../getNextRobotStateAndWarnings/dispenseUpdateLiquidState')
jest.mock('../utils/curryCommandCreator')

const curryCommandCreatorMock = curryCommandCreator as jest.MockedFunction<
  typeof curryCommandCreator
>

const mockWasteChuteId = 'mockWasteChuteId'
const mockAddressableAreaName: 'A3' = 'A3'
const mockId = 'mockId'

let invariantContext = makeContext()
const args = {
  pipetteId: mockId,
  addressableAreaName: mockAddressableAreaName,
  volume: 10,
  flowRate: 10,
  prevRobotState: getInitialRobotStateStandard(invariantContext),
}
const mockMoveToAddressableAreaParams = {
  pipetteId: mockId,
  addressableAreaName: mockAddressableAreaName,
}

const mockPipEntities: PipetteEntities = {
  [mockId]: {
    name: 'p50_single_flex',
    id: mockId,
  },
} as any

describe('wasteChuteCommandsUtil', () => {
  beforeEach(() => {
    invariantContext = {
      ...invariantContext,
      pipetteEntities: mockPipEntities,
      additionalEquipmentEntities: {
        [mockWasteChuteId]: {
          name: 'wasteChute',
          location: WASTE_CHUTE_CUTOUT,
          id: 'mockId',
        },
      },
    }
  })
  it('returns correct commands for dispensing', () => {
    wasteChuteCommandsUtil({ ...args, type: 'dispense' })
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(
      moveToAddressableArea,
      mockMoveToAddressableAreaParams
    )
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(dispenseInPlace, {
      pipetteId: mockId,
      volume: 10,
      flowRate: 10,
    })
  })
  it('returns correct commands for blow out', () => {
    wasteChuteCommandsUtil({
      ...args,
      type: 'blowOut',
    })
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(
      moveToAddressableArea,
      mockMoveToAddressableAreaParams
    )
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(blowOutInPlace, {
      pipetteId: mockId,
      flowRate: 10,
    })
  })
  it('returns correct commands for drop tip', () => {
    wasteChuteCommandsUtil({
      ...args,
      type: 'dropTip',
      prevRobotState: {
        ...args.prevRobotState,
        tipState: { pipettes: { [mockId]: true } } as any,
      },
    })
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(
      moveToAddressableArea,
      mockMoveToAddressableAreaParams
    )
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(dropTipInPlace, {
      pipetteId: mockId,
    })
  })
  it('returns correct commands for air gap/aspirate in place', () => {
    wasteChuteCommandsUtil({
      ...args,
      type: 'airGap',
      prevRobotState: {
        ...args.prevRobotState,
        tipState: { pipettes: { [mockId]: true } } as any,
      },
    })
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(
      moveToAddressableArea,
      mockMoveToAddressableAreaParams
    )
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(aspirateInPlace, {
      pipetteId: mockId,
      volume: 10,
      flowRate: 10,
    })
  })
})
