import { getInitialRobotStateStandard, makeContext } from '../fixtures'
import { curryCommandCreator } from '../utils'
import { movableTrashCommandsUtil } from '../utils/movableTrashCommandsUtil'
import {
  aspirateInPlace,
  blowOutInPlace,
  dispenseInPlace,
  moveToAddressableArea,
  moveToAddressableAreaForDropTip,
} from '../commandCreators/atomic'
import type { PipetteEntities } from '../types'

jest.mock('../getNextRobotStateAndWarnings/dispenseUpdateLiquidState')
jest.mock('../utils/curryCommandCreator')

const curryCommandCreatorMock = curryCommandCreator as jest.MockedFunction<
  typeof curryCommandCreator
>

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
    movableTrashCommandsUtil({
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
    movableTrashCommandsUtil({
      ...args,
      type: 'dropTip',
      prevRobotState: {
        ...args.prevRobotState,
        tipState: { pipettes: { [mockId]: true } } as any,
      },
    })
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(
      moveToAddressableAreaForDropTip,
      mockMoveToAddressableAreaParams
    )
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
