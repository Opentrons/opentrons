import { getLabwareDefURI } from '@opentrons/shared-data'
import _fixtureTiprack10ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import _fixtureTiprack1000ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'
import {
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from '../fixtures'
import { expectTimelineError } from '../__utils__/testMatchers'
import { airGap } from '../commandCreators/atomic/airGap'
import { thermocyclerPipetteCollision, modulePipetteCollision } from '../utils'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { AspDispAirgapParams } from '@opentrons/shared-data/protocol/types/schemaV3'
import type { InvariantContext, RobotState } from '../'
jest.mock('../utils/thermocyclerPipetteCollision')
jest.mock('../utils/modulePipetteCollision')

const fixtureTiprack10ul = _fixtureTiprack10ul as LabwareDefinition2
const fixtureTiprack1000ul = _fixtureTiprack1000ul as LabwareDefinition2

const mockThermocyclerPipetteCollision = thermocyclerPipetteCollision as jest.MockedFunction<
  typeof thermocyclerPipetteCollision
>
const mockModulePipetteCollision = modulePipetteCollision as jest.MockedFunction<
  typeof modulePipetteCollision
>

describe('airGap', () => {
  let invariantContext: InvariantContext,
    robotStateNoTip: RobotState,
    robotStateWithTip: RobotState,
    flowRateAndOffsets: Partial<AspDispAirgapParams>
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateNoTip = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
    flowRateAndOffsets = {
      flowRate: 6,
      offsetFromBottomMm: 5,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should return an air gap command', () => {
    const params = {
      ...flowRateAndOffsets,
      pipette: DEFAULT_PIPETTE,
      volume: 50,
      labware: SOURCE_LABWARE,
      well: 'A1',
    } as AspDispAirgapParams
    const result = airGap({ ...params }, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).commands).toEqual([
      {
        command: 'airGap',
        params,
      },
    ])
  })
  it('should return pipette error when using an invalid pipette', () => {
    const result = airGap(
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
  it('should return a labware error when using invalid labware', () => {
    const result = airGap(
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
    expectTimelineError(getErrorResult(result).errors, 'LABWARE_DOES_NOT_EXIST')
  })
  it('should return a no tip error when there is no tip', () => {
    const params = {
      ...flowRateAndOffsets,
      pipette: DEFAULT_PIPETTE,
      volume: 50,
      labware: SOURCE_LABWARE,
      well: 'A1',
    } as AspDispAirgapParams
    const result = airGap({ ...params }, invariantContext, robotStateNoTip)
    expectTimelineError(getErrorResult(result).errors, 'NO_TIP_ON_PIPETTE')
  })
  it('should return a volume exceeded error when the air gap volume is above the tip max', () => {
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackDefURI = getLabwareDefURI(fixtureTiprack10ul)
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackLabwareDef = fixtureTiprack10ul
    const result = airGap(
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
    expectTimelineError(getErrorResult(result).errors, 'TIP_VOLUME_EXCEEDED')
  })
  it('should return a TC lid closed error when there is a pipette collision with a TC', () => {
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
    const result = airGap(
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
    expectTimelineError(
      getErrorResult(result).errors,
      'THERMOCYCLER_LID_CLOSED'
    )
  })
  it('should return a module collision error when there a module collision', () => {
    mockModulePipetteCollision.mockImplementationOnce(
      (args: {
        pipette: string | null | undefined
        labware: string | null | undefined
        invariantContext: InvariantContext
        prevRobotState: RobotState
      }): boolean => {
        const { pipette, labware, invariantContext, prevRobotState } = args
        expect(pipette).toEqual(DEFAULT_PIPETTE)
        expect(labware).toEqual(SOURCE_LABWARE)
        expect(invariantContext).toEqual(invariantContext)
        expect(prevRobotState).toEqual(robotStateWithTip)
        return true
      }
    )
    const result = airGap(
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
    expectTimelineError(
      getErrorResult(result).errors,
      'MODULE_PIPETTE_COLLISION_DANGER'
    )
  })
  it('should return a pipette volume exceeded error when the pipette volume is less than the air gap volume', () => {
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackDefURI = getLabwareDefURI(fixtureTiprack1000ul)
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackLabwareDef = fixtureTiprack1000ul
    const result = airGap(
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
    expectTimelineError(
      getErrorResult(result).errors,
      'PIPETTE_VOLUME_EXCEEDED'
    )
  })
})
