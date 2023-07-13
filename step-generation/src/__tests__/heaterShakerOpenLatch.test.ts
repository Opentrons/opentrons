import { when, resetAllWhenMocks } from 'jest-when'
import { getLabwareDefURI, getPipetteNameSpecs } from '@opentrons/shared-data'
import { heaterShakerOpenLatch } from '../commandCreators/atomic/heaterShakerOpenLatch'
import _fixtureTiprack1000ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'
import { getIsTallLabwareEastWestOfHeaterShaker } from '../utils'
import {
  getErrorResult,
  getInitialRobotStateStandard,
  makeContext,
  DEFAULT_PIPETTE,
} from '../fixtures'
import type { InvariantContext, RobotState } from '../types'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

jest.mock('../utils/heaterShakerCollision')

const fixtureTiprack1000ul = _fixtureTiprack1000ul as LabwareDefinition2
const FLEX_PIPETTE = 'p1000_single_flex'
const FlexPipetteNameSpecs = getPipetteNameSpecs(FLEX_PIPETTE)

const mockGetIsTallLabwareEastWestOfHeaterShaker = getIsTallLabwareEastWestOfHeaterShaker as jest.MockedFunction<
  typeof getIsTallLabwareEastWestOfHeaterShaker
>
describe('heaterShakerOpenLatch', () => {
  const HEATER_SHAKER_ID = 'heaterShakerId'
  const HEATER_SHAKER_SLOT = '1'
  let robotState: RobotState
  let invariantContext: InvariantContext
  beforeEach(() => {
    const context = makeContext()
    invariantContext = {
      ...context,
      labwareEntities: {
        ...context.labwareEntities,
        tiprack2Id: {
          id: 'tiprack2Id',
          // this tiprack is tall enough to trigger the latch open warning
          labwareDefURI: getLabwareDefURI(fixtureTiprack1000ul),
          def: fixtureTiprack1000ul,
        },
      },
    }
    const state = getInitialRobotStateStandard(invariantContext)

    robotState = {
      ...state,
      modules: {
        ...state.modules,
        [HEATER_SHAKER_ID]: {
          slot: HEATER_SHAKER_SLOT,
        } as any,
      },
    }
  })
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should return an error when there is labware east/west that is above 53 mm', () => {
    when(mockGetIsTallLabwareEastWestOfHeaterShaker)
      .calledWith(
        robotState.labware,
        invariantContext.labwareEntities,
        HEATER_SHAKER_SLOT
      )
      .mockReturnValue(true)
    const result = heaterShakerOpenLatch(
      {
        moduleId: HEATER_SHAKER_ID,
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'TALL_LABWARE_EAST_WEST_OF_HEATER_SHAKER',
    })
  })
  it('should not return an error when there is labware east/west that is above 53 mm for flex', () => {
    if (FlexPipetteNameSpecs != null) {
      invariantContext.pipetteEntities[
        DEFAULT_PIPETTE
      ].spec = FlexPipetteNameSpecs
    }
    mockGetIsTallLabwareEastWestOfHeaterShaker.mockReturnValue(false)

    const result = heaterShakerOpenLatch(
      {
        moduleId: HEATER_SHAKER_ID,
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'heaterShaker/openLabwareLatch',
          key: expect.any(String),
          params: { moduleId: 'heaterShakerId' },
        },
      ],
    })
  })
  it('should return an open latch command when there is no labware that is too tall east/west of the heater shaker', () => {
    when(mockGetIsTallLabwareEastWestOfHeaterShaker)
      .calledWith(
        robotState.labware,
        invariantContext.labwareEntities,
        HEATER_SHAKER_SLOT
      )
      .mockReturnValue(false)
    const result = heaterShakerOpenLatch(
      {
        moduleId: HEATER_SHAKER_ID,
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'heaterShaker/openLabwareLatch',
          key: expect.any(String),
          params: { moduleId: 'heaterShakerId' },
        },
      ],
    })
  })
})
