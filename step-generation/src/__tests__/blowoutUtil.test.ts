import { BlowoutParams } from '@opentrons/shared-data/protocol/types/schemaV3'
import {
  blowoutUtil,
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '../utils'
import {
  blowOutInPlace,
  moveToAddressableArea,
  blowout,
} from '../commandCreators/atomic'
import { curryCommandCreator } from '../utils/curryCommandCreator'
import {
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
  DEST_LABWARE,
  TROUGH_LABWARE,
  BLOWOUT_FLOW_RATE,
  BLOWOUT_OFFSET_FROM_TOP_MM,
  makeContext,
  getInitialRobotStateStandard,
} from '../fixtures'
import type { RobotState, InvariantContext } from '../types'
jest.mock('../utils/curryCommandCreator')

const curryCommandCreatorMock = curryCommandCreator as jest.MockedFunction<
  typeof curryCommandCreator
>

let blowoutArgs: {
  pipette: BlowoutParams['pipette']
  sourceLabwareId: string
  sourceWell: BlowoutParams['well']
  destLabwareId: string
  destWell: BlowoutParams['well']
  blowoutLocation: string | null | undefined
  flowRate: number
  offsetFromTopMm: number
  invariantContext: InvariantContext
  prevRobotState: RobotState
}
describe('blowoutUtil', () => {
  let invariantContext: InvariantContext

  beforeEach(() => {
    invariantContext = makeContext()

    blowoutArgs = {
      pipette: DEFAULT_PIPETTE,
      sourceLabwareId: SOURCE_LABWARE,
      sourceWell: 'A1',
      destLabwareId: DEST_LABWARE,
      destWell: 'A2',
      flowRate: BLOWOUT_FLOW_RATE,
      offsetFromTopMm: BLOWOUT_OFFSET_FROM_TOP_MM,
      invariantContext,
      blowoutLocation: null,
      prevRobotState: getInitialRobotStateStandard(invariantContext),
    }
    curryCommandCreatorMock.mockClear()
  })
  it('blowoutUtil curries blowout with source well params', () => {
    blowoutUtil({
      ...blowoutArgs,
      blowoutLocation: SOURCE_WELL_BLOWOUT_DESTINATION,
    })
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(blowout, {
      pipette: blowoutArgs.pipette,
      labware: blowoutArgs.sourceLabwareId,
      well: blowoutArgs.sourceWell,
      flowRate: blowoutArgs.flowRate,
      offsetFromBottomMm: expect.any(Number),
    })
  })
  it('blowoutUtil curries waste chute commands when there is no well', () => {
    const wasteChuteId = 'wasteChuteId'
    invariantContext = {
      ...invariantContext,
      additionalEquipmentEntities: {
        [wasteChuteId]: {
          id: wasteChuteId,
          name: 'wasteChute',
          location: 'cutoutD3',
        },
      },
    }
    blowoutUtil({
      ...blowoutArgs,
      destLabwareId: wasteChuteId,
      invariantContext: invariantContext,
      destWell: null,
      blowoutLocation: wasteChuteId,
    })
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(
      moveToAddressableArea,
      {
        addressableAreaName: '1and8ChannelWasteChute',
        pipetteId: blowoutArgs.pipette,
      }
    )
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(blowOutInPlace, {
      flowRate: 2.3,
      pipetteId: blowoutArgs.pipette,
    })
  })
  it('blowoutUtil curries blowout with dest plate params', () => {
    blowoutUtil({
      ...blowoutArgs,
      blowoutLocation: DEST_WELL_BLOWOUT_DESTINATION,
    })
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(blowout, {
      pipette: blowoutArgs.pipette,
      labware: blowoutArgs.destLabwareId,
      well: blowoutArgs.destWell,
      flowRate: blowoutArgs.flowRate,
      offsetFromBottomMm: expect.any(Number),
    })
  })
  it('blowoutUtil curries blowout with an arbitrary labware Id', () => {
    blowoutUtil({
      ...blowoutArgs,
      blowoutLocation: TROUGH_LABWARE,
    })
    expect(curryCommandCreatorMock).toHaveBeenCalledWith(blowout, {
      pipette: blowoutArgs.pipette,
      labware: TROUGH_LABWARE,
      well: 'A1',
      flowRate: blowoutArgs.flowRate,
      offsetFromBottomMm: expect.any(Number),
    })
  })
  it('blowoutUtil returns an empty array if not given a blowoutLocation', () => {
    const result = blowoutUtil({
      ...blowoutArgs,
      blowoutLocation: null,
    })
    expect(curryCommandCreatorMock).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })
})
