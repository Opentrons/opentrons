import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixture96Plate,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import { flexStackerRetrieve } from '../commandCreators/atomic/flexStackerRetrieve'
import { HOPPER_STACKER_LOCATION } from '../constants'
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

const mockLabwareId = 'labwareId'
const mockLabwareId2 = 'labwareId2'
const mockLabwareId3 = 'labwareId3'
const mockModuleId = 'flexStackerId'
vi.mock('../robotStateSelectors')

describe('flexStackerRetrieve', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)
    invariantContext.moduleEntities[mockModuleId] = {
      id: mockModuleId,
      type: FLEX_STACKER_MODULE_TYPE,
      model: FLEX_STACKER_MODULE_V1,
      pythonName: 'mock_flex_stacker_1',
    }
    vi.mocked(flexStackerStateGetter).mockReturnValue(
      {} as FlexStackerModuleState
    )
  })
  it('creates flex stacker retrieve command', () => {
    robotState = {
      ...robotState,
      modules: {
        [mockModuleId]: {
          slot: 'D3',
          moduleState: {} as any,
        },
      },
      labware: {
        [mockLabwareId]: {
          stack: [mockLabwareId, HOPPER_STACKER_LOCATION, mockModuleId, 'D3'],
        },
        [mockLabwareId2]: {
          stack: [
            mockLabwareId2,
            mockLabwareId,
            HOPPER_STACKER_LOCATION,
            mockModuleId,
            'D3',
          ],
        },
        [mockLabwareId3]: {
          stack: [mockLabwareId3, mockModuleId, 'D3'],
        },
      },
    }
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        [mockLabwareId]: {
          labwareDefURI: 'mockURI',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'wellPlate_1',
          id: mockLabwareId,
        },
        [mockLabwareId2]: {
          labwareDefURI: 'mockURI',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'wellPlate_2',
          id: mockLabwareId2,
        },
        [mockLabwareId3]: {
          labwareDefURI: 'mockURI',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'wellPlate_3',
          id: mockLabwareId3,
        },
      },
    }
    const result = flexStackerRetrieve(
      {
        moduleId: mockModuleId,
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'flexStacker/retrieve',
          key: expect.any(String),
          params: {
            moduleId: mockModuleId,
          },
        },
      ],
      python: 'wellPlate_1 = mock_flex_stacker_1.retrieve()',
    })
  })
  it('raises an error if the hopper is empty', () => {
    robotState = {
      ...robotState,
      modules: {
        [mockModuleId]: {
          slot: 'D3',
          moduleState: {} as any,
        },
      },
      labware: {
        [mockLabwareId]: {
          stack: [mockLabwareId, 'D2'],
        },
      },
    }
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        [mockLabwareId]: {
          labwareDefURI: 'mockURI',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'wellPlate_1',
          id: mockLabwareId,
        },
      },
    }
    const result = flexStackerRetrieve(
      {
        moduleId: mockModuleId,
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HOPPER_EMPTY',
    })
  })
  it('raises an error if the shuttle is full', () => {
    vi.mocked(flexStackerStateGetter).mockReturnValue({
      labwareOnShuttle: {
        primaryLabwareId: mockLabwareId,
        adapterLabwareId: null,
        lidLabwareId: null,
      },
      labwareInHopper: null,
      maxPoolCount: 10,
      storedLabwareDetails: null,
      type: FLEX_STACKER_MODULE_TYPE,
    })
    robotState = {
      ...robotState,
      modules: {
        [mockModuleId]: {
          slot: 'D3',
          moduleState: {} as any,
        },
      },
      labware: {
        [mockLabwareId]: {
          stack: [mockLabwareId, 'D3'],
        },
      },
    }
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        [mockLabwareId]: {
          labwareDefURI: 'mockURI',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'wellPlate_1',
          id: mockLabwareId,
        },
      },
    }
    const result = flexStackerRetrieve(
      {
        moduleId: mockModuleId,
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'SHUTTLE_FULL',
    })
  })
})
