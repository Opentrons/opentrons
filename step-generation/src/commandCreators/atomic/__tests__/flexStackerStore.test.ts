import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixture96Plate,
  fixture384Plate,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import {
  getErrorResult,
  getInitialRobotStateStandard,
  makeContext,
} from '../../../fixtures'
import { flexStackerStateGetter } from '../../../robotStateSelectors'
import { flexStackerStore } from '../flexStackerStore'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  FlexStackerModuleState,
  InvariantContext,
  RobotState,
} from '../../../types'

const moduleId = 'flexStackerId'
vi.mock('../../../robotStateSelectors')

describe('flexStackerStore', () => {
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
    invariantContext.labwareEntities = {
      mockLabwareId: {
        id: 'mockLabwareId',
        labwareDefURI: 'mockURI',
        def: fixture96Plate as LabwareDefinition2,
        pythonName: 'wellPlate_1',
      },
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
        primaryLabwareURI: 'mockURI',
        lidLabwareURI: null,
        adapterLabwareURI: null,
      },
      type: FLEX_STACKER_MODULE_TYPE,
    } as FlexStackerModuleState)
    robotState = {
      ...robotState,
      modules: {
        [moduleId]: {
          slot: 'D3',
          moduleState: {} as FlexStackerModuleState,
        },
      },
      labware: {
        mockLabwareId: {
          stack: ['mockLabwareId', 'D3'],
        },
      },
    }
  })

  it('creates flex stacker store command', () => {
    const result = flexStackerStore(
      { moduleId, strategy: 'automatic' },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'flexStacker/store',
          key: expect.any(String),
          params: {
            moduleId,
            strategy: 'automatic',
          },
        },
      ],
      python: 'mock_flex_stacker_1.store()',
    })
  })

  it('raises an error if the shuttle is empty', () => {
    vi.mocked(flexStackerStateGetter).mockReturnValue({
      labwareOnShuttle: null,
      labwareInHopper: null,
      maxPoolCount: 10,
      storedLabwareDetails: null,
      type: FLEX_STACKER_MODULE_TYPE,
    })

    const emptyShuttleRobotState: RobotState = {
      ...robotState,
      modules: {
        [moduleId]: {
          slot: 'D3',
          moduleState: {} as FlexStackerModuleState,
        },
      },
    }

    const emptyShuttleInvariantContext: InvariantContext = {
      ...invariantContext,
      labwareEntities: {
        [moduleId]: {
          id: moduleId,
          labwareDefURI: 'mockURI',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'wellPlate_1',
        },
      },
    }

    const result = flexStackerStore(
      { moduleId, strategy: 'automatic' },
      emptyShuttleInvariantContext,
      emptyShuttleRobotState
    )

    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'SHUTTLE_EMPTY',
    })
  })

  it('raises an error if the labware to be stored does not match the current labware in the hopper', () => {
    vi.mocked(flexStackerStateGetter).mockReturnValue({
      labwareOnShuttle: {
        primaryLabwareId: 'labware-in-shuttle',
        adapterLabwareId: null,
        lidLabwareId: null,
      },
      labwareInHopper: [
        {
          primaryLabwareId: 'labware-in-hopper',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
      ],
      maxPoolCount: 10,
      storedLabwareDetails: {
        primaryLabwareURI: 'mockURI',
        lidLabwareURI: null,
        adapterLabwareURI: null,
      },
      type: FLEX_STACKER_MODULE_TYPE,
    })
    const mismatchRobotState: RobotState = {
      ...robotState,
      modules: {
        [moduleId]: {
          slot: 'D3',
          moduleState: {} as FlexStackerModuleState,
        },
      },
      labware: {
        'labware-in-hopper': { stack: ['labware-in-hopper', 'D3'] },
        'labware-in-shuttle': { stack: ['labware-in-shuttle', 'D3'] },
      },
    }
    const mismatchInvariantContext: InvariantContext = {
      ...invariantContext,
      labwareEntities: {
        'labware-in-hopper': {
          id: 'labware-in-hopper',
          labwareDefURI: 'mockURI',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'wellPlate_1',
        },
        'labware-in-shuttle': {
          id: 'labware-in-shuttle',
          labwareDefURI: 'differentMockURI',
          def: fixture384Plate as LabwareDefinition2,
          pythonName: 'wellPlate_2',
        },
      },
    }
    const result = flexStackerStore(
      { moduleId, strategy: 'automatic' },
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
        primaryLabwareURI: 'mockURI',
        lidLabwareURI: null,
        adapterLabwareURI: null,
      },
      type: FLEX_STACKER_MODULE_TYPE,
    } as FlexStackerModuleState)
    const fullRobotState = {
      ...robotState,
      modules: {
        [moduleId]: {
          slot: 'D3',
          moduleState: {} as FlexStackerModuleState,
        },
      },
      labware: {
        mockLabwareId: {
          stack: ['mockLabwareId', 'D3'],
        },
      },
    }
    const result = flexStackerStore(
      { moduleId, strategy: 'automatic' },
      invariantContext,
      fullRobotState
    )
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HOPPER_FULL',
    })
  })
})
