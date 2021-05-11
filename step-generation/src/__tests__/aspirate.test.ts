import { expectTimelineError } from '../__utils__/testMatchers'
import { aspirate } from '../commandCreators/atomic/aspirate'
import { getLabwareDefURI } from '@opentrons/shared-data'
import _fixtureTiprack10ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import _fixtureTiprack1000ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'
import { thermocyclerPipetteCollision } from '../utils'
import {
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from '../fixtures'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { AspDispAirgapParams } from '@opentrons/shared-data/protocol/types/schemaV3'
import type { InvariantContext, RobotState } from '../'

const fixtureTiprack10ul = _fixtureTiprack10ul as LabwareDefinition2
const fixtureTiprack1000ul = _fixtureTiprack1000ul as LabwareDefinition2

jest.mock('../utils/thermocyclerPipetteCollision')
const mockThermocyclerPipetteCollision = thermocyclerPipetteCollision as jest.MockedFunction<
  typeof thermocyclerPipetteCollision
>
describe('aspirate', () => {
  let initialRobotState: RobotState
  let robotStateWithTip: RobotState
  let invariantContext: InvariantContext
  let flowRateAndOffsets: Partial<AspDispAirgapParams>
  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
    flowRateAndOffsets = {
      flowRate: 6,
      offsetFromBottomMm: 5,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('aspirate normally (with tip)', () => {
    const params = {
      ...flowRateAndOffsets,
      pipette: DEFAULT_PIPETTE,
      volume: 50,
      labware: SOURCE_LABWARE,
      well: 'A1',
    } as AspDispAirgapParams
    const result = aspirate(params, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).commands).toEqual([
      {
        command: 'aspirate',
        params,
      },
    ])
  })
  it('aspirate with volume > tip max volume should throw error', () => {
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackDefURI = getLabwareDefURI(fixtureTiprack10ul)
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackLabwareDef = fixtureTiprack10ul
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 201,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'TIP_VOLUME_EXCEEDED',
    })
  })
  it('aspirate with volume > pipette max volume should throw error', () => {
    // NOTE: assigning p300 to a 1000uL tiprack is nonsense, just for this test
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackDefURI = getLabwareDefURI(fixtureTiprack1000ul)
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackLabwareDef = fixtureTiprack1000ul
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 301,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'PIPETTE_VOLUME_EXCEEDED',
    })
  })
  it('aspirate with invalid pipette ID should return error', () => {
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: 'badPipette',
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expectTimelineError(getErrorResult(result).errors, 'PIPETTE_DOES_NOT_EXIST')
  })
  it('aspirate with no tip should return error', () => {
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      initialRobotState
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'NO_TIP_ON_PIPETTE',
    })
  })
  it('aspirate from nonexistent labware should return error', () => {
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: 'problematicLabwareId',
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })
  it('should return an error when aspirating from thermocycler with pipette collision', () => {
    mockThermocyclerPipetteCollision.mockImplementationOnce(
      (
        modules: RobotState['modules'],
        labware: RobotState['labware'],
        labwareId: string
      ) => {
        expect(modules).toBe(robotStateWithTip.modules)
        expect(labware).toBe(robotStateWithTip.labware)
        expect(labwareId).toBe(SOURCE_LABWARE)
        return true
      }
    )
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'THERMOCYCLER_LID_CLOSED',
    })
  })
})
