import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixture96Plate,
  fixture384Plate,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import { flexStackerFillItems } from '../commandCreators/atomic/flexStackerFillItems'
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
const labwareId = 'labwareId'
const labwareId2 = 'labwareId2'
const labwareId3 = 'labwareId3'
const labwareId4 = 'labwareId4'
const labwareId5 = 'labwareId5'
vi.mock('../robotStateSelectors')

describe('flexStackerFillItems', () => {
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
      [labwareId]: {
        id: labwareId,
        def: fixture96Plate as LabwareDefinition2,
        labwareDefURI: 'mockURI',
        pythonName: 'mock_labware_1',
      },
      [labwareId2]: {
        id: labwareId2,
        def: fixture96Plate as LabwareDefinition2,
        labwareDefURI: 'mockURI',
        pythonName: 'mock_labware_2',
      },
      [labwareId3]: {
        id: labwareId3,
        def: fixture96Plate as LabwareDefinition2,
        labwareDefURI: 'mockURI',
        pythonName: 'mock_labware_3',
      },
      [labwareId4]: {
        id: labwareId4,
        def: fixture96Plate as LabwareDefinition2,
        labwareDefURI: 'mockURI',
        pythonName: 'mock_labware_4',
      },
      [labwareId5]: {
        id: labwareId5,
        def: fixture96Plate as LabwareDefinition2,
        labwareDefURI: 'mockURI',
        pythonName: 'mock_labware_5',
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
  })
  it('creates flex stacker fill command with 1 labware', () => {
    const result = flexStackerFillItems(
      {
        moduleId,
        labware: [labwareId],
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'flexStacker/fillItems',
          key: expect.any(String),
          params: {
            moduleId,
            labware: [labwareId],
          },
        },
      ],
      python: `
mock_flex_stacker_1.fill_items(
    labware=[mock_labware_1],
)`.trimStart(),
    })
  })
  it('creates flex stacker fill command with 5 labware and a message', () => {
    const result = flexStackerFillItems(
      {
        moduleId,
        labware: [labwareId, labwareId2, labwareId3, labwareId4, labwareId5],
        message: 'a fill message',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'flexStacker/fillItems',
          key: expect.any(String),
          params: {
            moduleId,
            labware: [
              labwareId,
              labwareId2,
              labwareId3,
              labwareId4,
              labwareId5,
            ],
            message: 'a fill message',
          },
        },
      ],
      python: `
mock_flex_stacker_1.fill_items(
    labware=[
        mock_labware_1, mock_labware_2, mock_labware_3, mock_labware_4,
        mock_labware_5
    ],
    message="a fill message",
)`.trimStart(),
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
    const result = flexStackerFillItems(
      {
        moduleId,
        labware: ['labware1', 'labware2'],
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
    const result = flexStackerFillItems(
      { moduleId, labware: [] },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HOPPER_FULL',
    })
  })
})
