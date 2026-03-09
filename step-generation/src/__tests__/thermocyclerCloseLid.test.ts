import { describe, expect, it } from 'vitest'

import {
  fixture96Plate,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

import { thermocyclerCloseLid } from '../commandCreators/atomic/thermocyclerCloseLid'
import {
  getErrorResult,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
} from '../fixtures'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../types'

const mockThermocyclerId = 'thermocyclerId'
const mockLidId = 'mockLidId'
let invariantContext: InvariantContext = {
  ...makeContext(),
  moduleEntities: {
    [mockThermocyclerId]: {
      id: mockThermocyclerId,
      pythonName: 'mock_tc',
      type: THERMOCYCLER_MODULE_TYPE,
      model: THERMOCYCLER_MODULE_V2,
    },
  },
}
let prevRobotState: RobotState = getInitialRobotStateStandard(invariantContext)

describe('thermocyclerCloseLid', () => {
  it('generates the correct python for closing lid', () => {
    const result = thermocyclerCloseLid(
      {
        moduleId: mockThermocyclerId,
      },
      invariantContext,
      prevRobotState
    )
    expect(getSuccessResult(result).python).toBe(
      `
mock_tc.close_lid()
`.trim()
    )
  })
  it('should render the correct python for closing with a tc lid on top', () => {
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        [mockLidId]: {
          id: mockLidId,
          pythonName: 'mock_lid',
          labwareDefURI: 'opentrons/opentrons_tough_pcr_auto_sealing_lid/1',
          def: {
            ...fixture96Plate,
            allowedRoles: ['lid'],
            parameters: {
              loadName: 'opentrons_tough_pcr_auto_sealing_lid',
            } as any,
          } as LabwareDefinition2,
        },
      },
    }
    prevRobotState = {
      ...prevRobotState,
      labware: {
        [mockLidId]: {
          stack: [mockLidId, mockThermocyclerId, 'B1'],
        },
      },
    }
    const result = thermocyclerCloseLid(
      {
        moduleId: mockThermocyclerId,
      },
      invariantContext,
      prevRobotState
    )
    expect(getSuccessResult(result).python).toBe(
      `
mock_tc.close_lid()
  `.trim()
    )
  })
  it('should render a timeline error when lid is not compatible with closing TC', () => {
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        [mockLidId]: {
          id: mockLidId,
          pythonName: 'mock_lid',
          labwareDefURI: 'opentrons/opentrons_tough_universal_lid/1',
          def: {
            ...fixture96Plate,
            allowedRoles: ['lid'],
            parameters: {
              loadName: 'opentrons_tough_universal_lid',
            } as any,
          } as LabwareDefinition2,
        },
      },
    }
    prevRobotState = {
      ...prevRobotState,
      labware: {
        [mockLidId]: {
          stack: [mockLidId, mockThermocyclerId, 'B1'],
        },
      },
    }
    const result = thermocyclerCloseLid(
      {
        moduleId: mockThermocyclerId,
      },
      invariantContext,
      prevRobotState
    )
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'CLOSING_THERMOCYCLER_WITH_INVALID_LABWARE_LID',
    })
  })
})
