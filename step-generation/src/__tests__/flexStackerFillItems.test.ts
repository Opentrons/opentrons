import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixture96Plate,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  LabwareDefinition2,
} from '@opentrons/shared-data'

import { flexStackerFillItems } from '../commandCreators/atomic/flexStackerFillItems'
import { getInitialRobotStateStandard, makeContext } from '../fixtures'

import type { InvariantContext, RobotState } from '../types'

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
})
