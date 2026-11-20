import { beforeEach, describe, expect, it } from 'vitest'

import {
  A1_NOZZLE,
  A12_NOZZLE,
  ALL,
  COLUMN,
  fixture96Plate,
  fixtureP100096V2Specs,
  fixtureTiprack1000ul,
  fixtureTiprackAdapter,
  H1_NOZZLE,
  PARTIAL_COLUMN,
  ROW,
  SINGLE,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V2,
} from '@opentrons/shared-data'

import { getPipetteMovementSafetyStatus } from '..'
import { CLEAN, VACUUM_DOCK_LOCATION } from '../../constants'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../types'

const mockLabwareId = 'labwareId'
const mockPipId = 'pip'
const mockTiprackId = 'tiprackId'
const mockTipUri = 'mockTipUri'
const mockModule = 'moduleId'
const mockLabware2 = 'labwareId2'
const mockAdapter = 'adapterId'
const mockWellName = 'A1'

describe('getPipetteMovementSafetyStatus', () => {
  let mockInvariantProperties: InvariantContext
  let mockRobotState: RobotState
  beforeEach(() => {
    mockInvariantProperties = {
      pipetteEntities: {
        pip: {
          name: 'p1000_96',
          id: 'pip',
          tiprackDefURI: ['mockDefUri'],
          tiprackLabwareDef: [fixtureTiprack1000ul as LabwareDefinition2],
          spec: fixtureP100096V2Specs,
          pythonName: 'mockPythonName',
        },
      },
      labwareEntities: {
        [mockLabwareId]: {
          id: mockLabwareId,
          labwareDefURI: 'mockDefUri',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'mockPythonName',
        },
        [mockTiprackId]: {
          id: mockTiprackId,
          labwareDefURI: mockTipUri,
          def: fixtureTiprack1000ul as LabwareDefinition2,
          pythonName: 'mockPythonName',
        },
        [mockAdapter]: {
          id: mockAdapter,
          labwareDefURI: 'mockAdapterUri',
          def: fixtureTiprackAdapter as LabwareDefinition2,
          pythonName: 'mockPythonName',
        },
        [mockLabware2]: {
          id: mockLabware2,
          labwareDefURI: 'mockDefUri',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'mockPythonName',
        },
      },
      moduleEntities: {},
      trashBinEntities: {},
      wasteChuteEntities: {},
      stagingAreaEntities: {},
      gripperEntities: {},
      liquidEntities: {},
      runtimeParameters: {},
      config: {
        OT_PD_DISABLE_MODULE_RESTRICTIONS: false,
      },
    }
    mockRobotState = {
      pipettes: { pip: { mount: 'left' } },
      labware: {
        [mockLabwareId]: { stack: ['mockLabwareId', 'D2'] },
        [mockTiprackId]: { stack: ['mockTiprackId', 'A2'] },
      },
      modules: {},
      tipState: { tipracks: {}, pipettes: {} },
      liquidState: {
        pipettes: {},
        labware: {},
        trashBins: {},
        wasteChute: {},
      },
    }
  })

  it('returns true when the labware id is a trash bin', () => {
    const { isSafe } = getPipetteMovementSafetyStatus({
      pipetteId: mockPipId,
      robotState: {
        labware: {},
        pipettes: {},
        modules: {},
        tipState: {},
        liquidState: {},
      } as any,
      invariantContext: mockInvariantProperties,
      labwareId: 'mockId',
      wellLocationOffset: { x: 0, y: 0, z: 0 },
      wellTargetName: mockWellName,
      primaryNozzle: A1_NOZZLE,
      nozzleConfiguration: ALL,
    })
    expect(isSafe).toEqual(true)
  })
  it('returns false when 96ch single tip pick up will overlap with waste chute', () => {
    const { isSafe } = getPipetteMovementSafetyStatus({
      robotState: {
        ...mockRobotState,
        pipettes: {
          ...mockRobotState.pipettes,
          [mockPipId]: {
            ...mockRobotState.pipettes[mockPipId],
            nozzles: SINGLE,
            primaryNozzle: A1_NOZZLE,
          },
        },
      },
      invariantContext: {
        ...mockInvariantProperties,
        wasteChuteEntities: {
          id: {
            id: 'id',
            location: 'cutoutD3',
            pythonName: 'waste_chute',
          },
        },
      },
      pipetteId: mockPipId,
      labwareId: mockLabwareId,
      wellLocationOffset: { x: -12, y: -100, z: 20 },
      wellTargetName: mockWellName,
      primaryNozzle: A1_NOZZLE,
      nozzleConfiguration: SINGLE,
    })
    expect(isSafe).toEqual(false)
  })
  it('returns false when within pipette extents is false', () => {
    const { isSafe } = getPipetteMovementSafetyStatus({
      robotState: {
        ...mockRobotState,
        pipettes: {
          ...mockRobotState.pipettes,
          [mockPipId]: {
            ...mockRobotState.pipettes[mockPipId],
            nozzles: COLUMN,
          },
        },
      },
      invariantContext: mockInvariantProperties,
      pipetteId: mockPipId,
      labwareId: mockLabwareId,
      wellLocationOffset: { x: -12, y: -100, z: 20 },
      wellTargetName: mockWellName,
      primaryNozzle: A1_NOZZLE,
      nozzleConfiguration: COLUMN,
    })
    expect(isSafe).toEqual(false)
  })
  it('returns true when there are no collisions and a module near it', () => {
    mockRobotState.modules = {
      [mockModule]: { slot: 'D1', moduleState: {} as any },
    }
    mockInvariantProperties.moduleEntities = {
      [mockModule]: {
        id: mockModule,
        type: TEMPERATURE_MODULE_TYPE,
        model: TEMPERATURE_MODULE_V2,
        pythonName: 'mockPythonName',
      },
    }
    const { isSafe } = getPipetteMovementSafetyStatus({
      robotState: mockRobotState,
      invariantContext: mockInvariantProperties,
      pipetteId: mockPipId,
      labwareId: mockLabwareId,
      wellLocationOffset: { x: -1, y: 5, z: 20 },
      wellTargetName: mockWellName,
      primaryNozzle: A1_NOZZLE,
      nozzleConfiguration: ALL,
    })
    expect(isSafe).toEqual(true)
  })
  it('returns false when there is a tip that collides', () => {
    mockRobotState.tipState.tipracks = {
      mockTiprackId: { A1: CLEAN },
    }
    mockRobotState.labware = {
      ...mockRobotState.labware,
      [mockAdapter]: { stack: [mockAdapter, 'D1'] },
    }
    const { isSafe } = getPipetteMovementSafetyStatus({
      robotState: {
        ...mockRobotState,
        pipettes: {
          ...mockRobotState.pipettes,
          [mockPipId]: {
            ...mockRobotState.pipettes[mockPipId],
            nozzles: COLUMN,
          },
        },
      },
      invariantContext: mockInvariantProperties,
      pipetteId: mockPipId,
      labwareId: mockLabwareId,
      wellLocationOffset: { x: -1, y: 5, z: 0 },
      wellTargetName: mockWellName,
      primaryNozzle: A12_NOZZLE,
      nozzleConfiguration: COLUMN,
    })
    expect(isSafe).toEqual(false)
  })
  it('returns false when there is a tall module nearby in a diagonal slot with adapter and labware', () => {
    mockRobotState.modules = {
      [mockModule]: { slot: 'D1', moduleState: {} as any },
    }
    mockRobotState.labware = {
      [mockLabwareId]: { stack: [mockLabwareId, 'D2'] },
      [mockAdapter]: {
        stack: [mockAdapter, mockModule, 'D1'],
      },
      [mockLabware2]: {
        stack: [mockLabware2, mockAdapter, mockModule, 'D1'],
      },
    }
    mockInvariantProperties.moduleEntities = {
      [mockModule]: {
        id: mockModule,
        type: TEMPERATURE_MODULE_TYPE,
        model: TEMPERATURE_MODULE_V2,
        pythonName: 'mockPythonName',
      },
    }
    const { isSafe } = getPipetteMovementSafetyStatus({
      robotState: {
        ...mockRobotState,
        pipettes: {
          ...mockRobotState.pipettes,
          [mockPipId]: {
            ...mockRobotState.pipettes[mockPipId],
            nozzles: COLUMN,
          },
        },
      },
      invariantContext: mockInvariantProperties,
      pipetteId: mockPipId,
      labwareId: mockLabwareId,
      wellLocationOffset: { x: 0, y: 0, z: 0 },
      wellTargetName: mockWellName,
      primaryNozzle: A12_NOZZLE,
      nozzleConfiguration: COLUMN,
    })
    expect(isSafe).toEqual(false)
  })

  const collarId = 'collarId'
  const withCollar = (
    plateSlot: string,
    collarStack: string[]
  ): { robotState: RobotState; invariantContext: InvariantContext } => {
    const plate = fixture96Plate as LabwareDefinition2
    return {
      robotState: {
        ...mockRobotState,
        labware: {
          [mockLabwareId]: { stack: [mockLabwareId, plateSlot] },
          [collarId]: { stack: collarStack },
        },
        modules: {
          vacuum: { slot: 'A3', moduleState: {} as any },
        },
      },
      invariantContext: {
        ...mockInvariantProperties,
        labwareEntities: {
          ...mockInvariantProperties.labwareEntities,
          [collarId]: {
            id: collarId,
            labwareDefURI: 'opentrons/opentrons_vacuum_manifold_collar_short/1',
            pythonName: 'collar',
            def: {
              ...plate,
              parameters: {
                ...plate.parameters,
                loadName: 'opentrons_vacuum_manifold_collar_short',
                quirks: ['vacuumModuleDock'],
              },
              metadata: {
                ...plate.metadata,
                displayName: 'Vacuum collar',
              },
            },
          },
        },
      },
    }
  }

  it('allows a full 8-channel move beside a north collar', () => {
    const { robotState, invariantContext } = withCollar('B3', [
      collarId,
      'vacuum',
      'A3',
    ])
    invariantContext.pipetteEntities.pip.spec = {
      ...fixtureP100096V2Specs,
      channels: 8,
    }
    const { isSafe } = getPipetteMovementSafetyStatus({
      robotState,
      invariantContext,
      pipetteId: mockPipId,
      labwareId: mockLabwareId,
      wellTargetName: mockWellName,
      primaryNozzle: A1_NOZZLE,
      nozzleConfiguration: ALL,
    })
    expect(isSafe).toEqual(true)
  })

  it('allows a full 96-channel move beside an east collar', () => {
    const { robotState, invariantContext } = withCollar('A2', [
      collarId,
      'vacuum',
      'A3',
    ])
    const { isSafe } = getPipetteMovementSafetyStatus({
      robotState,
      invariantContext,
      pipetteId: mockPipId,
      labwareId: mockLabwareId,
      wellTargetName: mockWellName,
      primaryNozzle: A1_NOZZLE,
      nozzleConfiguration: ALL,
    })
    expect(isSafe).toEqual(true)
  })

  it('allows a row starting at A1 beside an east collar', () => {
    const { robotState, invariantContext } = withCollar('A2', [
      collarId,
      'vacuum',
      'A3',
    ])
    const { isSafe } = getPipetteMovementSafetyStatus({
      robotState,
      invariantContext,
      pipetteId: mockPipId,
      labwareId: mockLabwareId,
      wellTargetName: 'B1',
      primaryNozzle: A1_NOZZLE,
      nozzleConfiguration: ROW,
    })
    expect(isSafe).toEqual(true)
  })

  it('rejects a column whose primary is not on the east edge', () => {
    const { robotState, invariantContext } = withCollar('A2', [
      collarId,
      'vacuum',
      'A3',
    ])
    const status = getPipetteMovementSafetyStatus({
      robotState,
      invariantContext,
      pipetteId: mockPipId,
      labwareId: mockLabwareId,
      wellTargetName: mockWellName,
      primaryNozzle: A1_NOZZLE,
      nozzleConfiguration: COLUMN,
    })
    expect(status).toEqual({
      isSafe: false,
      reason: expect.objectContaining({
        type: 'vacuumCollarCollision',
        side: 'east',
        slot: 'A2',
        collarSlot: 'A3',
        primaryNozzle: A1_NOZZLE,
        suggestion:
          'a configuration whose primary nozzle is A12 or H12, or a row starting at A1 or H1',
      }),
    })
  })

  it('allows column 12 beside an east collar on the dock', () => {
    const { robotState, invariantContext } = withCollar('A3', [
      collarId,
      VACUUM_DOCK_LOCATION,
    ])
    const { isSafe } = getPipetteMovementSafetyStatus({
      robotState,
      invariantContext,
      pipetteId: mockPipId,
      labwareId: mockLabwareId,
      wellTargetName: mockWellName,
      primaryNozzle: A12_NOZZLE,
      nozzleConfiguration: COLUMN,
    })
    expect(isSafe).toEqual(true)
  })

  it('rejects an 8-channel partial column whose primary faces away from a north collar', () => {
    const { robotState, invariantContext } = withCollar('B3', [
      collarId,
      'vacuum',
      'A3',
    ])
    invariantContext.pipetteEntities.pip.spec = {
      ...fixtureP100096V2Specs,
      channels: 8,
    }
    const status = getPipetteMovementSafetyStatus({
      robotState,
      invariantContext,
      pipetteId: mockPipId,
      labwareId: mockLabwareId,
      wellTargetName: mockWellName,
      primaryNozzle: H1_NOZZLE,
      nozzleConfiguration: PARTIAL_COLUMN,
    })
    expect(status).toEqual({
      isSafe: false,
      reason: expect.objectContaining({
        type: 'vacuumCollarCollision',
        side: 'north',
        channels: 8,
        suggestion: 'a configuration whose primary nozzle is A1',
      }),
    })
  })

  it('ignores a collar on a diagonal slot', () => {
    const { robotState, invariantContext } = withCollar('B2', [
      collarId,
      'vacuum',
      'A3',
    ])
    const { isSafe } = getPipetteMovementSafetyStatus({
      robotState,
      invariantContext,
      pipetteId: mockPipId,
      labwareId: mockLabwareId,
      wellTargetName: mockWellName,
      primaryNozzle: A1_NOZZLE,
      nozzleConfiguration: COLUMN,
    })
    expect(isSafe).toEqual(true)
  })
  //    todo(jr, 4/23/24): add more test cases, test thermocycler collision - i'll do this in a follow up
})
