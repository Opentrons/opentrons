import { beforeEach, describe, expect, it } from 'vitest'

import { flexDeckDefV5 } from '@opentrons/shared-data'

import {
  getAddressableAreaFromModule,
  getAddressableAreaNameFromLabwareLocation,
  getAllLargestStacks,
  getAllProvidedAddressableAreasInDeckConfig,
  getFullStackFromNodeTopDownRecursive,
  getLargestStackContainingLabware,
  getNodeParentModuleId,
  getProvidedAddressableAreasExposed,
} from '../traversals'

import type {
  AddressableAreaName,
  DeckConfiguration,
  DeckDefinition,
} from '@opentrons/shared-data'
import type { ModuleEntities, RobotState } from '../../types'

let mockRobotState: RobotState
let mockModuleEntities: ModuleEntities
let mockDeckConfiguration: DeckConfiguration

describe('traversals', () => {
  beforeEach(() => {
    mockRobotState = {
      labware: {
        lw1: {
          stackedOnNode: { labwareId: 'lw2' },
        },
        lw2: {
          stackedOnNode: { moduleId: 'mod2' },
        },
        lw3: {
          stackedOnNode: { labwareId: 'lw4' },
        },
        lw4: {
          stackedOnNode: { addressableAreaName: 'heaterShakerV1D1' },
        },
        lw5: {
          stackedOnNode: { moduleId: 'mod1' },
        },
      },
      modules: {
        mod1: {
          slot: 'A1',
        },
        mod2: {
          slot: 'A3',
        },
      },
    } as unknown as RobotState
    mockDeckConfiguration = [
      {
        cutoutId: 'cutoutA1',
        cutoutFixtureId: 'heaterShakerModuleV1',
      },
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: 'vacuumModuleV1',
      },
    ]
    mockModuleEntities = {
      mod1: {
        id: 'mod1',
        type: 'heaterShakerModuleType',
        model: 'heaterShakerModuleV1',
      },
      mod2: {
        id: 'mod2',
        type: 'vacuumModuleType',
        model: 'vacuumModuleV1',
      },
    } as unknown as ModuleEntities
  })
  describe('getFullStackFromNodeTopDownRecursive', () => {
    it('walks labware -> labware -> module and returns LoadedLabwareLocation[]', () => {
      const { stack } = getFullStackFromNodeTopDownRecursive({
        node: { labwareId: 'lw1' },
        robotState: mockRobotState,
      })
      expect(stack).toEqual([
        { labwareId: 'lw1' },
        { labwareId: 'lw2' },
        { moduleId: 'mod2' },
      ])
    })

    it('walks labware -> labware -> addressableArea and returns LoadedLabwareLocation[]', () => {
      const { stack } = getFullStackFromNodeTopDownRecursive({
        node: { labwareId: 'lw1' },
        robotState: {
          ...mockRobotState,
          labware: {
            ...mockRobotState.labware,
            lw2: {
              ...mockRobotState.labware.lw2,
              stackedOnNode: { addressableAreaName: 'D4' },
            },
          },
        },
      })
      expect(stack).toEqual([
        { labwareId: 'lw1' },
        { labwareId: 'lw2' },
        { addressableAreaName: 'D4' },
      ])
    })

    it('when the start node is not labware, returns a stack of that node only', () => {
      const { stack } = getFullStackFromNodeTopDownRecursive({
        node: { moduleId: 'mod1' },
        robotState: mockRobotState,
      })
      expect(stack).toEqual([{ moduleId: 'mod1' }])
    })

    it('when labware has no stackedOnNode, returns the initial stack slice (empty by default)', () => {
      const { stack } = getFullStackFromNodeTopDownRecursive({
        node: { labwareId: 'solo' },
        robotState: {
          ...mockRobotState,
          labware: {
            solo: { stackedOnNode: undefined },
          },
        } as unknown as RobotState,
      })
      expect(stack).toEqual([])
    })

    it('records entries in memo when a memo map is passed in', () => {
      const memo = new Map()
      const { stack, memo: outMemo } = getFullStackFromNodeTopDownRecursive({
        node: { labwareId: 'lw1' },
        robotState: mockRobotState,
        memo,
      })
      expect(stack).toHaveLength(3)
      expect(outMemo.size).toBeGreaterThan(0)
    })
  })

  describe('getNodeParentModuleId', () => {
    it('returns the module id if the node is on a module', () => {
      expect(
        getNodeParentModuleId({
          node: { addressableAreaName: 'vacuumModuleV1DockA4' },
          robotState: mockRobotState,
          deckDef: flexDeckDefV5 as unknown as DeckDefinition,
          deckConfiguration: mockDeckConfiguration,
        })
      ).toEqual('mod2')
    })
    it('returns null if the possible matching module is in another slot', () => {
      expect(
        getNodeParentModuleId({
          node: { addressableAreaName: 'vacuumModuleV1DockA4' },
          robotState: {
            ...mockRobotState,
            modules: {
              ...mockRobotState.modules,
              mod2: { ...mockRobotState.modules.mod1, slot: 'B1' },
            },
          },
          deckDef: flexDeckDefV5 as unknown as DeckDefinition,
          deckConfiguration: mockDeckConfiguration,
        })
      ).toEqual(null)
    })

    it('returns null if no matching module', () => {
      expect(
        getNodeParentModuleId({
          node: { addressableAreaName: 'vacuumModuleV1DockA4' },
          robotState: {
            ...mockRobotState,
            modules: {},
          },
          deckDef: flexDeckDefV5 as unknown as DeckDefinition,
          deckConfiguration: mockDeckConfiguration,
        })
      ).toEqual(null)
    })

    it('returns null when the stack has no addressableAreaName node', () => {
      expect(
        getNodeParentModuleId({
          node: { labwareId: 'lw1' },
          robotState: mockRobotState,
          deckDef: flexDeckDefV5 as unknown as DeckDefinition,
          deckConfiguration: mockDeckConfiguration,
        })
      ).toBeNull()
    })
  })

  describe('getLargestStackContainingLabware', () => {
    it('returns the largest stack containing the node when input is top', () => {
      expect(
        getLargestStackContainingLabware({
          labwareId: 'lw1',
          robotState: mockRobotState,
        })
      ).toEqual([
        { labwareId: 'lw1' },
        { labwareId: 'lw2' },
        { moduleId: 'mod2' },
      ])
    })

    it('returns the largest stack containing the node when input is not top', () => {
      expect(
        getLargestStackContainingLabware({
          labwareId: 'lw2',
          robotState: mockRobotState,
        })
      ).toEqual([
        { labwareId: 'lw1' },
        { labwareId: 'lw2' },
        { moduleId: 'mod2' },
      ])
    })

    it('returns an empty array when no stack in state contains the labware id', () => {
      expect(
        getLargestStackContainingLabware({
          labwareId: 'not-on-any-stack',
          robotState: mockRobotState,
        })
      ).toEqual([])
    })
  })

  describe('getAllLargestStacks', () => {
    it('returns all the largest stacks', () => {
      expect(getAllLargestStacks(mockRobotState)).toEqual([
        [{ labwareId: 'lw1' }, { labwareId: 'lw2' }, { moduleId: 'mod2' }],
        [
          { labwareId: 'lw3' },
          { labwareId: 'lw4' },
          { addressableAreaName: 'heaterShakerV1D1' },
        ],
        [{ labwareId: 'lw5' }, { moduleId: 'mod1' }],
      ])
    })

    it('returns an empty array when there is no labware', () => {
      expect(
        getAllLargestStacks({
          labware: {},
          modules: {},
        } as unknown as RobotState)
      ).toEqual([])
    })
  })

  describe('getAddressableAreaNameFromLabwareLocation', () => {
    it('returns the addressable area name for a module location', () => {
      expect(
        getAddressableAreaNameFromLabwareLocation({
          location: { moduleId: 'mod1' },
          robotState: mockRobotState,
          moduleEntities: mockModuleEntities,
          deckDef: flexDeckDefV5 as unknown as DeckDefinition,
        })
      ).toEqual('heaterShakerV1A1')
    })

    it('returns the addressable area name for a addressableAreaName location', () => {
      expect(
        getAddressableAreaNameFromLabwareLocation({
          location: { addressableAreaName: 'someAA' as AddressableAreaName },
          robotState: mockRobotState,
          moduleEntities: mockModuleEntities,
          deckDef: flexDeckDefV5 as unknown as DeckDefinition,
        })
      ).toEqual('someAA')
    })

    it('returns the slot id as addressable area name for a slotName location', () => {
      expect(
        getAddressableAreaNameFromLabwareLocation({
          location: { slotName: 'B2' },
          robotState: mockRobotState,
          moduleEntities: mockModuleEntities,
          deckDef: flexDeckDefV5 as unknown as DeckDefinition,
        })
      ).toEqual('B2')
    })

    it('returns null for offDeck, systemLocation, and wasteChuteLocation', () => {
      for (const location of [
        'offDeck',
        'systemLocation',
        'wasteChuteLocation',
      ] as const) {
        expect(
          getAddressableAreaNameFromLabwareLocation({
            location,
            robotState: mockRobotState,
            moduleEntities: mockModuleEntities,
            deckDef: flexDeckDefV5 as unknown as DeckDefinition,
          })
        ).toBeNull()
      }
    })

    it('returns null for a bare labwareId location (not handled as a deck anchor)', () => {
      expect(
        getAddressableAreaNameFromLabwareLocation({
          location: { labwareId: 'lw1' },
          robotState: mockRobotState,
          moduleEntities: mockModuleEntities,
          deckDef: flexDeckDefV5 as unknown as DeckDefinition,
        })
      ).toBeNull()
    })

    it('for inStackerHopper, resolves addressable area via moduleId like on-module', () => {
      expect(
        getAddressableAreaNameFromLabwareLocation({
          location: { kind: 'inStackerHopper', moduleId: 'mod2' },
          robotState: mockRobotState,
          moduleEntities: mockModuleEntities,
          deckDef: flexDeckDefV5 as unknown as DeckDefinition,
        })
      ).toEqual('vacuumModuleV1A3')
    })
  })

  describe('getAllProvidedAddressableAreasInDeckConfig', () => {
    beforeEach(() => {
      mockDeckConfiguration = [
        ...mockDeckConfiguration,
        { cutoutId: 'cutoutC2', cutoutFixtureId: 'magneticBlockV1' },
      ]
    })
    it('returns all the provided addressable areas in the deck configuration', () => {
      const result = getAllProvidedAddressableAreasInDeckConfig({
        deckConfiguration: mockDeckConfiguration,
        deckDefinition: flexDeckDefV5 as unknown as DeckDefinition,
      })

      expect(result).not.toContain('C2')
      expect(result).toContain('magneticBlockV1C2')
    })

    it('returns an empty set when deck configuration is empty', () => {
      expect(
        getAllProvidedAddressableAreasInDeckConfig({
          deckConfiguration: [],
          deckDefinition: flexDeckDefV5 as unknown as DeckDefinition,
        })
      ).toEqual(new Set())
    })
  })

  describe('getAddressableAreaFromModule', () => {
    it('returns the addressable area name for a module location', () => {
      expect(
        getAddressableAreaFromModule({
          moduleId: 'mod1',
          robotState: mockRobotState,
          moduleEntities: mockModuleEntities,
          deckDef: flexDeckDefV5 as unknown as DeckDefinition,
        })
      ).toEqual('heaterShakerV1A1')
    })

    it('returns null when the module id is missing from robot state', () => {
      expect(
        getAddressableAreaFromModule({
          moduleId: 'unknownMod',
          robotState: mockRobotState,
          moduleEntities: mockModuleEntities,
          deckDef: flexDeckDefV5 as unknown as DeckDefinition,
        })
      ).toBeNull()
    })

    it('returns null when the module id is missing from module entities', () => {
      expect(
        getAddressableAreaFromModule({
          moduleId: 'mod1',
          robotState: mockRobotState,
          moduleEntities: {} as ModuleEntities,
          deckDef: flexDeckDefV5 as unknown as DeckDefinition,
        })
      ).toBeNull()
    })
  })

  describe('getProvidedAddressableAreasExposed', () => {
    it('returns the provided addressable areas exposed', () => {
      expect(
        getProvidedAddressableAreasExposed({
          labwareId: 'lw1',
          robotState: mockRobotState,
          deckConfiguration: mockDeckConfiguration,
          deckDefinition: flexDeckDefV5 as unknown as DeckDefinition,
          moduleEntities: mockModuleEntities,
        })
      ).toEqual(
        // Base mock deck config is only HS (A1) + vacuum (A3); magnetic C2 is added only in nested getAllProvided tests.
        new Set(['vacuumModuleV1DockA4'])
      )
    })
  })
})
