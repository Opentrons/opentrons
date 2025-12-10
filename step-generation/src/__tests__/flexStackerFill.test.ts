import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixture96Plate,
  fixture384Plate,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import { flexStackerFill } from '../commandCreators/atomic/flexStackerFill'
import {
  getErrorResult,
  getInitialRobotStateStandard,
  makeContext,
} from '../fixtures'
import { flexStackerStateGetter } from '../robotStateSelectors'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  FlexStackerModuleState,
  InvariantContext,
  RobotState,
} from '../types'

const moduleId = 'flexStackerId'
vi.mock('../robotStateSelectors')

describe('flexStackerFill', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)
    invariantContext.moduleEntities[moduleId] = {
      id: moduleId,
      type: FLEX_STACKER_MODULE_TYPE,
      model: FLEX_STACKER_MODULE_V1,
      pythonName: 'mock_flex_stacker_1',
    }

    vi.mocked(flexStackerStateGetter).mockReturnValue({
      labwareOnShuttle: {
        primaryLabwareId: 'mockLabwareId',
        adapterLabwareId: null,
        lidLabwareId: null,
      },
      labwareInHopper: [
        {
          primaryLabwareId: 'mockLabwareId',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
      ],
      maxPoolCount: 10,
      storedLabwareDetails: {
        moduleId,
        initialCount: 5,
        primaryLabware: {
          loadName: 'fixture_96_plate',
          namespace: 'opentrons',
          version: 1,
        },
        lidLabware: null,
        adapterLabware: null,
      },
      type: FLEX_STACKER_MODULE_TYPE,
    } as FlexStackerModuleState)
  })

  it('creates flex stacker fill command with count', () => {
    const result = flexStackerFill(
      {
        moduleId,
        count: 10,
        strategy: 'manualWithPause',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'flexStacker/fill',
          key: expect.any(String),
          params: {
            moduleId,
            strategy: 'manualWithPause',
            count: 10,
          },
        },
      ],
      python: 'mock_flex_stacker_1.fill(count=10)',
    })
  })

  it('creates flex stacker fill command with message', () => {
    const result = flexStackerFill(
      {
        moduleId,
        message: 'Filling...',
        strategy: 'manualWithPause',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'flexStacker/fill',
          key: expect.any(String),
          params: {
            moduleId,
            strategy: 'manualWithPause',
            message: 'Filling...',
          },
        },
      ],
      python: 'mock_flex_stacker_1.fill(message="Filling...")',
    })
  })
  it('raises an error if the labware being stored does not match the current labware in the hopper', () => {
    const mismatchInvariantContext: InvariantContext = {
      ...invariantContext,
      labwareEntities: {
        labware1: {
          id: 'labware1',
          labwareDefURI: 'mockURI',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'wellPlate_1',
        },
        labware2: {
          id: 'labware2',
          labwareDefURI: 'differentMockURI',
          def: fixture384Plate as LabwareDefinition2,
          pythonName: 'wellPlate_2',
        },
      },
    }
    const mismatchRobotState: RobotState = {
      ...robotState,
      modules: {
        [moduleId]: {
          slot: 'D3',
          moduleState: {} as FlexStackerModuleState,
        },
      },
      labware: {
        labware1: { stack: ['labware1', 'D1'] },
        labware2: { stack: ['labware2', 'D2'] },
      },
    }
    const result = flexStackerFill(
      {
        moduleId,
        strategy: 'manualWithPause',
        labwareToStore: [
          {
            primaryLabwareId: 'labware1',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
          {
            primaryLabwareId: 'labware2',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
        ],
      },
      mismatchInvariantContext,
      mismatchRobotState
    )
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'MISMATCHED_STACKER_LABWARE_TYPE',
    })
  })
  it('raises an error if the hopper is full', () => {
    vi.mocked(flexStackerStateGetter).mockReturnValue({
      labwareOnShuttle: {
        primaryLabwareId: 'mockLabwareId',
        adapterLabwareId: null,
        lidLabwareId: null,
      },
      labwareInHopper: [
        {
          primaryLabwareId: 'mockLabwareId',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
      ],
      maxPoolCount: 1,
      storedLabwareDetails: {
        moduleId,
        initialCount: 1,
        primaryLabware: {
          loadName: 'fixture_96_plate',
          namespace: 'opentrons',
          version: 1,
        },
        lidLabware: null,
        adapterLabware: null,
      },
      type: FLEX_STACKER_MODULE_TYPE,
    } as FlexStackerModuleState)
    const result = flexStackerFill(
      { moduleId, strategy: 'manualWithPause' },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HOPPER_FULL',
    })
  })
})
