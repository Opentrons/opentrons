import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixture96Plate,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import {
  getErrorResult,
  getInitialRobotStateStandard,
  makeContext,
} from '../../../fixtures'
import { flexStackerStateGetter } from '../../../robotStateSelectors'
import { flexStackerFillItems } from '../flexStackerFillItems'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

const moduleId = 'flexStackerId'
const labwareId = 'labwareId'
const labwareId2 = 'labwareId2'
const labwareId3 = 'labwareId3'
const labwareId4 = 'labwareId4'
const labwareId5 = 'labwareId5'
vi.mock('../../../robotStateSelectors')

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
      ...invariantContext.labwareEntities,
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
    robotState.modules = {
      [moduleId]: {
        slot: 'D4',
        moduleState: {} as any,
      },
    }
    robotState.labware = {
      [labwareId]: {
        stack: [labwareId, 'offDeck'],
      },
      [labwareId2]: {
        stack: [labwareId2, 'offDeck'],
      },
      [labwareId3]: {
        stack: [labwareId3, 'offDeck'],
      },
      [labwareId4]: {
        stack: [labwareId4, 'offDeck'],
      },
      [labwareId5]: {
        stack: [labwareId5, 'offDeck'],
      },
    }
    vi.mocked(flexStackerStateGetter).mockReturnValue({
      labwareOnShuttle: {
        primaryLabwareId: 'mockURI',
        adapterLabwareId: null,
        lidLabwareId: null,
      },
      labwareInHopper: [
        {
          primaryLabwareId: 'mockURI',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
      ],
      storedLabwareDetails: {
        primaryLabwareURI: 'mockURI',
        lidLabwareURI: null,
        adapterLabwareURI: null,
      },
      type: FLEX_STACKER_MODULE_TYPE,
    })
  })
  it('creates flex stacker fill command with 1 labware', () => {
    invariantContext.labwareEntities = {
      [labwareId]: {
        id: labwareId,
        def: fixture96Plate as LabwareDefinition2,
        labwareDefURI: 'mockURI',
        pythonName: 'mock_labware_1',
      },
    }
    robotState.labware = {
      [labwareId]: {
        stack: [labwareId, 'offDeck'],
      },
    }
    const result = flexStackerFillItems(
      {
        moduleId,
        commandCreatorFnName: 'flexStackerFillItems',
        interventionMessage: null,
        fillLabwareUri: 'mockURI',
        fillLabwareIds: [labwareId],
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
        commandCreatorFnName: 'flexStackerFillItems',
        interventionMessage: 'a fill message',
        fillLabwareUri: 'mockURI',
        fillLabwareIds: [
          labwareId,
          labwareId2,
          labwareId3,
          labwareId4,
          labwareId5,
        ],
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
  //  TODO: idk if this error is possible at this point since we are filtering for a specific uri that is already in moduleState
  // it('raises an error if the labware being stored does not match the current labware in the hopper', () => {
  //   const mismatchInvariantContext: InvariantContext = {
  //     ...invariantContext,
  //     labwareEntities: {
  //       labware1: {
  //         id: 'labware1',
  //         labwareDefURI: 'mockURI',
  //         def: fixture96Plate as LabwareDefinition2,
  //         pythonName: 'wellPlate_1',
  //       },
  //       labware2: {
  //         id: 'labware2',
  //         labwareDefURI: 'differentMockURI',
  //         def: fixture384Plate as LabwareDefinition2,
  //         pythonName: 'wellPlate_2',
  //       },
  //     },
  //   }
  //   const mismatchRobotState: RobotState = {
  //     ...robotState,
  //     modules: {
  //       [moduleId]: {
  //         slot: 'D3',
  //         moduleState: {} as FlexStackerModuleState,
  //       },
  //     },
  //     labware: {
  //       labware1: {
  //         stack: ['labware1', 'offDeck'],
  //       },
  //       labware2: {
  //         stack: ['labware2', 'offDeck'],
  //       },
  //     },
  //   }
  //   const result = flexStackerFillItems(
  //     {
  //       moduleId,
  //       interventionMessage: null,
  //       commandCreatorFnName: 'flexStackerFillItems',
  //       fillPrimaryLabwareUri: 'mockURI',
  //       fillLidLabwareUri: null,
  //       fillAdapterLabwareUri: null,
  //       fillQuantity: 1,
  //     },
  //     mismatchInvariantContext,
  //     mismatchRobotState
  //   )
  //   expect(getErrorResult(result).errors[0]).toMatchObject({
  //     type: 'MISMATCHED_STACKER_LABWARE_TYPE',
  //   })
  // })
  it('raises an error if the hopper is full', () => {
    vi.mocked(flexStackerStateGetter).mockReturnValue({
      labwareOnShuttle: {
        primaryLabwareId: 'tiprack1Id',
        adapterLabwareId: null,
        lidLabwareId: null,
      },
      labwareInHopper: [
        {
          primaryLabwareId: 'tiprack1Id',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
        {
          primaryLabwareId: 'tiprack1Id',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
        {
          primaryLabwareId: 'tiprack1Id',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
        {
          primaryLabwareId: 'tiprack1Id',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
        {
          primaryLabwareId: 'tiprack1Id',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
        {
          primaryLabwareId: 'tiprack1Id',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
        {
          primaryLabwareId: 'tiprack1Id',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
        {
          primaryLabwareId: 'tiprack1Id',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
        {
          primaryLabwareId: 'tiprack1Id',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
      ],
      storedLabwareDetails: {
        primaryLabwareURI: 'fixture/fixture_tiprack_300_ul/1',
        lidLabwareURI: null,
        adapterLabwareURI: null,
      },
      type: FLEX_STACKER_MODULE_TYPE,
    })
    const result = flexStackerFillItems(
      {
        moduleId,
        interventionMessage: null,
        commandCreatorFnName: 'flexStackerFillItems',
        fillLabwareUri: 'mockURI',
        fillLabwareIds: ['tiprack1Id'],
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HOPPER_FULL',
    })
  })
})
