import cloneDeep from 'lodash/cloneDeep'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  fixture96Plate,
  FLEX_STACKER_A4_ADDRESSABLE_AREA,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  MOVABLE_TRASH_A3_ADDRESSABLE_AREA,
} from '@opentrons/shared-data'

import { FLEX_STACKER_MODULE_INITIAL_STATE } from '../../constants'
import {
  DEST_LABWARE,
  getInitialRobotStateStandard,
  makeContext,
  SOURCE_LABWARE,
} from '../../fixtures'
import { TOUCHED_PIPETTABLE_LABWARE } from '../../types'
import { forMoveLabware } from '../forMoveLabware'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../types'

describe('forMoveLabware', () => {
  describe('stackedOnNode', () => {
    let invariantContext: InvariantContext
    let robotState: RobotState

    beforeEach(() => {
      invariantContext = makeContext()
      robotState = getInitialRobotStateStandard(invariantContext)
    })

    it('sets stackedOnNode on the moved labware to the params newLocation (deck slot)', () => {
      const newLocation = { slotName: 'A1' }
      forMoveLabware(
        {
          labwareId: SOURCE_LABWARE,
          newLocation,
          strategy: 'usingGripper',
        },
        invariantContext,
        { robotState, warnings: [] }
      )
      expect(robotState.labware[SOURCE_LABWARE].stackedOnNode).toBe(newLocation)
      expect(robotState.labware[SOURCE_LABWARE].stack).toEqual([
        SOURCE_LABWARE,
        'A1',
      ])
    })

    it('sets stackedOnNode for off-deck destination', () => {
      const newLocation = 'offDeck' as const
      forMoveLabware(
        {
          labwareId: SOURCE_LABWARE,
          newLocation,
          strategy: 'manualMoveWithPause',
        },
        invariantContext,
        { robotState, warnings: [] }
      )
      expect(robotState.labware[SOURCE_LABWARE].stackedOnNode).toBe(newLocation)
      expect(robotState.labware[SOURCE_LABWARE].stack[1]).toBe('offDeck')
    })

    it('sets stackedOnNode for on-labware destination (labwareId)', () => {
      const newLocation = { labwareId: DEST_LABWARE }
      forMoveLabware(
        {
          labwareId: SOURCE_LABWARE,
          newLocation,
          strategy: 'usingGripper',
        },
        invariantContext,
        { robotState, warnings: [] }
      )
      expect(robotState.labware[SOURCE_LABWARE].stackedOnNode).toEqual(
        newLocation
      )
      expect(robotState.labware[SOURCE_LABWARE].stack).toEqual([
        SOURCE_LABWARE,
        DEST_LABWARE,
        '3',
      ])
    })

    it('sets stackedOnNode when PD uses slotName to mean another labware id', () => {
      const newLocation = { slotName: DEST_LABWARE }
      forMoveLabware(
        {
          labwareId: SOURCE_LABWARE,
          newLocation,
          strategy: 'usingGripper',
        },
        invariantContext,
        { robotState, warnings: [] }
      )
      expect(robotState.labware[SOURCE_LABWARE].stackedOnNode).toEqual(
        newLocation
      )
    })

    it('sets stackedOnNode for addressable-area destination', () => {
      const newLocation = {
        addressableAreaName: MOVABLE_TRASH_A3_ADDRESSABLE_AREA,
      }
      forMoveLabware(
        {
          labwareId: SOURCE_LABWARE,
          newLocation,
          strategy: 'usingGripper',
        },
        invariantContext,
        { robotState, warnings: [] }
      )
      expect(robotState.labware[SOURCE_LABWARE].stackedOnNode).toEqual(
        newLocation
      )
      expect(robotState.labware[SOURCE_LABWARE].stack).toEqual([
        SOURCE_LABWARE,
        MOVABLE_TRASH_A3_ADDRESSABLE_AREA,
      ])
    })

    it('sets sterility when newLocation.labwareId is pipettable labware', () => {
      const newLocation = { labwareId: DEST_LABWARE }
      forMoveLabware(
        {
          labwareId: SOURCE_LABWARE,
          newLocation,
          strategy: 'usingGripper',
        },
        invariantContext,
        { robotState, warnings: [] }
      )
      expect(robotState.labware[SOURCE_LABWARE].sterility).toBe(
        TOUCHED_PIPETTABLE_LABWARE
      )
    })

    it('re-runs sibling contains from shared stackedOnNode after the move', () => {
      const largeDef = {
        ...fixture96Plate,
        dimensions: {
          ...fixture96Plate.dimensions,
          xDimension: 200,
          yDimension: 150,
        },
      } as LabwareDefinition2
      const smallDef = {
        ...fixture96Plate,
        dimensions: {
          ...fixture96Plate.dimensions,
          xDimension: 100,
          yDimension: 80,
        },
      } as LabwareDefinition2

      const base = makeContext()
      invariantContext = {
        ...base,
        labwareEntities: {
          ...base.labwareEntities,
          lwBig: {
            id: 'lwBig',
            labwareDefURI: 'fixture/large/1',
            def: largeDef,
            pythonName: 'lw_big',
          },
          lwSmall: {
            id: 'lwSmall',
            labwareDefURI: 'fixture/small/1',
            def: smallDef,
            pythonName: 'lw_small',
          },
        },
      }
      robotState = getInitialRobotStateStandard(invariantContext)
      robotState.labware.lwBig = { stack: ['lwBig', 'B2'] }
      robotState.labware.lwSmall = {
        stack: ['lwSmall', 'A1'],
        stackedOnNode: { slotName: 'A1' },
        contains: 'stale-should-clear',
      }

      const newLocation = { slotName: 'A1' }
      forMoveLabware(
        {
          labwareId: 'lwBig',
          newLocation,
          strategy: 'usingGripper',
        },
        invariantContext,
        { robotState, warnings: [] }
      )

      expect(robotState.labware.lwBig.stackedOnNode).toEqual(newLocation)
      expect(robotState.labware.lwBig.contains).toBe('lwSmall')
      expect(robotState.labware.lwSmall.contains).toBeUndefined()
    })

    it('moves labware onto flex stacker shuttle (moduleId): updates stack and shuttle stackedOnNode', () => {
      const stackerModuleId = 'stackerModForMoveTest'
      const ic = {
        ...invariantContext,
        moduleEntities: {
          ...invariantContext.moduleEntities,
          [stackerModuleId]: {
            id: stackerModuleId,
            type: FLEX_STACKER_MODULE_TYPE,
            model: FLEX_STACKER_MODULE_V1,
            pythonName: 'flex_stacker',
          },
        },
      }
      const rs = cloneDeep(getInitialRobotStateStandard(ic))
      rs.modules[stackerModuleId] = {
        slot: 'A3',
        moduleState: cloneDeep(FLEX_STACKER_MODULE_INITIAL_STATE),
      }

      forMoveLabware(
        {
          labwareId: SOURCE_LABWARE,
          newLocation: { moduleId: stackerModuleId },
          strategy: 'usingGripper',
        },
        ic,
        { robotState: rs, warnings: [] }
      )

      expect(rs.labware[SOURCE_LABWARE].stack).toEqual([SOURCE_LABWARE, 'A3'])
      expect(rs.labware[SOURCE_LABWARE].stackedOnNode).toEqual({
        addressableAreaName: FLEX_STACKER_A4_ADDRESSABLE_AREA,
      })
    })

    it('only sets stackedOnNode on the primary moved labware id, not labware left behind in the stack', () => {
      const adapterNode = { slotName: '7' as const }
      robotState.labware.tiprack4AdapterId = {
        ...robotState.labware.tiprack4AdapterId,
        stackedOnNode: adapterNode,
      }
      robotState.labware.tiprack4Id = {
        stack: ['tiprack4Id', 'tiprack4AdapterId', '7'],
        stackedOnNode: { labwareId: 'tiprack4AdapterId' },
      }
      const newLocation = { slotName: '1' }
      forMoveLabware(
        {
          labwareId: 'tiprack4Id',
          newLocation,
          strategy: 'usingGripper',
        },
        invariantContext,
        { robotState, warnings: [] }
      )
      expect(robotState.labware.tiprack4Id.stackedOnNode).toEqual(newLocation)
      expect(robotState.labware.tiprack4AdapterId.stackedOnNode).toBe(
        adapterNode
      )
    })
  })

  it('returns without mutating when labwareId is missing from robot state', () => {
    const invariantContext = makeContext()
    const robotState = cloneDeep(getInitialRobotStateStandard(invariantContext))
    const snapshot = cloneDeep(robotState.labware)
    forMoveLabware(
      {
        labwareId: 'missingLabware',
        newLocation: { slotName: 'A1' },
        strategy: 'usingGripper',
      },
      invariantContext,
      { robotState, warnings: [] }
    )
    expect(robotState.labware).toEqual(snapshot)
  })
})
