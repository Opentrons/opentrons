import { beforeEach, describe, expect, it } from 'vitest'

import {
  fixture96Plate,
  FLEX_STACKER_A4_ADDRESSABLE_AREA,
  FLEX_STACKER_MODULE_TYPE,
  flexDeckDefV5,
} from '@opentrons/shared-data'

import {
  enrichRobotStateForStackGraphTraversals,
  getAddressableAreaFromModule,
  getAddressableAreaNameFromLabwareLocation,
  getAllLargestStacks,
  getAllProvidedAddressableAreasFromDeckConfig,
  getFullStackFromNodeTopDownRecursive,
  getLargestStackContainingLabware,
  getNodeParentModuleId,
  getProvidedAddressableAreasExposed,
  getStackedOnNodeFromPdStack,
} from '../traversals'

import type {
  AddressableAreaName,
  DeckConfiguration,
  DeckDefinition,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { LabwareEntities, ModuleEntities, RobotState } from '../../types'

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

  describe('getAllProvidedAddressableAreasFromDeckConfig', () => {
    beforeEach(() => {
      mockDeckConfiguration = [
        ...mockDeckConfiguration,
        { cutoutId: 'cutoutC2', cutoutFixtureId: 'magneticBlockV1' },
      ]
    })
    it('returns all the provided addressable areas in the deck configuration', () => {
      const result = getAllProvidedAddressableAreasFromDeckConfig({
        deckConfiguration: mockDeckConfiguration,
        deckDefinition: flexDeckDefV5 as unknown as DeckDefinition,
      })

      expect(result).not.toContain('C2')
      expect(result).toContain('magneticBlockV1C2')
    })

    it('returns an empty set when deck configuration is empty', () => {
      expect(
        getAllProvidedAddressableAreasFromDeckConfig({
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

  describe('enrichRobotStateForStackGraphTraversals', () => {
    let pdStyleStackRobotState: RobotState

    beforeEach(() => {
      pdStyleStackRobotState = {
        labware: {
          plate: { stack: ['plate', 'B2'] },
        },
        modules: {},
        pipettes: {},
        tipState: { tipracks: {}, pipettes: {} },
        liquidState: {
          pipettes: {},
          labware: {},
          trashBins: {},
          wasteChute: {},
        },
      }
    })

    it('derives stackedOnNode from PD-style stack for labware on a deck slot', () => {
      const result = enrichRobotStateForStackGraphTraversals(
        pdStyleStackRobotState,
        {} as ModuleEntities,
        {} as LabwareEntities
      )
      expect(result.labware.plate).toMatchObject({
        stack: ['plate', 'B2'],
        stackedOnNode: { slotName: 'B2' },
      })
    })

    it('preserves existing stackedOnNode when already set', () => {
      pdStyleStackRobotState.labware.plate.stackedOnNode = {
        slotName: 'C3',
      }
      const result = enrichRobotStateForStackGraphTraversals(
        pdStyleStackRobotState,
        {} as ModuleEntities,
        {} as LabwareEntities
      )
      expect(result.labware.plate.stackedOnNode).toEqual({ slotName: 'C3' })
    })

    it('sets contains on the smaller-footprint sibling when one labware strictly exceeds the other in X and Y', () => {
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
      const state: RobotState = {
        ...pdStyleStackRobotState,
        labware: {
          lwBig: {
            stack: ['lwBig', 'A1'],
          },
          lwSmall: {
            stack: ['lwSmall', 'A1'],
          },
        },
      }
      const labwareEntities: LabwareEntities = {
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
      }
      const result = enrichRobotStateForStackGraphTraversals(
        state,
        {} as ModuleEntities,
        labwareEntities
      )
      expect(result.labware.lwSmall).toEqual({
        stack: ['lwSmall', 'A1'],
        stackedOnNode: { slotName: 'A1' },
      })
      expect(result.labware.lwBig).toEqual({
        stack: ['lwBig', 'A1'],
        contains: 'lwSmall',
        stackedOnNode: { slotName: 'A1' },
      })
    })

    it('does not set contains when neither footprint strictly dominates in both X and Y', () => {
      const defWide = {
        ...fixture96Plate,
        dimensions: {
          ...fixture96Plate.dimensions,
          xDimension: 150,
          yDimension: 80,
        },
      } as LabwareDefinition2
      const defTall = {
        ...fixture96Plate,
        dimensions: {
          ...fixture96Plate.dimensions,
          xDimension: 80,
          yDimension: 150,
        },
      } as LabwareDefinition2
      const state: RobotState = {
        ...pdStyleStackRobotState,
        labware: {
          lwWide: {
            stack: ['lwWide', 'A1'],
            stackedOnNode: { slotName: 'A1' },
          },
          lwTall: {
            stack: ['lwTall', 'A1'],
            stackedOnNode: { slotName: 'A1' },
          },
        },
      }
      const labwareEntities: LabwareEntities = {
        lwWide: {
          id: 'lwWide',
          labwareDefURI: 'fixture/wide/1',
          def: defWide,
          pythonName: 'lw_wide',
        },
        lwTall: {
          id: 'lwTall',
          labwareDefURI: 'fixture/tall/1',
          def: defTall,
          pythonName: 'lw_tall',
        },
      }
      const result = enrichRobotStateForStackGraphTraversals(
        state,
        {} as ModuleEntities,
        labwareEntities
      )
      expect(result.labware.lwWide.contains).toBeUndefined()
      expect(result.labware.lwTall.contains).toBeUndefined()
    })

    it('does not set contains for siblings on inStackerHopper', () => {
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
      const hopperNode = { kind: 'inStackerHopper' as const, moduleId: 'mod1' }
      const state: RobotState = {
        ...pdStyleStackRobotState,
        labware: {
          a: {
            stack: ['a', 'hopper', 'mod1', 'A1'],
            stackedOnNode: hopperNode,
          },
          b: {
            stack: ['b', 'hopper', 'mod1', 'A1'],
            stackedOnNode: hopperNode,
          },
        },
      }
      const labwareEntities: LabwareEntities = {
        a: {
          id: 'a',
          labwareDefURI: 'fixture/a/1',
          def: largeDef,
          pythonName: 'a',
        },
        b: {
          id: 'b',
          labwareDefURI: 'fixture/b/1',
          def: smallDef,
          pythonName: 'b',
        },
      }
      const result = enrichRobotStateForStackGraphTraversals(
        state,
        {} as ModuleEntities,
        labwareEntities
      )
      expect(result.labware.a.contains).toBeUndefined()
      expect(result.labware.b.contains).toBeUndefined()
    })

    it('does not set contains when more than two labware share the same parent', () => {
      const def = fixture96Plate as LabwareDefinition2
      const parent = { slotName: 'A1' as const }
      const state: RobotState = {
        ...pdStyleStackRobotState,
        labware: {
          a: { stack: ['a', 'A1'], stackedOnNode: parent },
          b: { stack: ['b', 'A1'], stackedOnNode: parent },
          c: { stack: ['c', 'A1'], stackedOnNode: parent },
        },
      }
      const labwareEntities: LabwareEntities = {
        a: {
          id: 'a',
          labwareDefURI: 'fixture/96/1',
          def,
          pythonName: 'a',
        },
        b: {
          id: 'b',
          labwareDefURI: 'fixture/96/1',
          def,
          pythonName: 'b',
        },
        c: {
          id: 'c',
          labwareDefURI: 'fixture/96/1',
          def,
          pythonName: 'c',
        },
      }
      const result = enrichRobotStateForStackGraphTraversals(
        state,
        {} as ModuleEntities,
        labwareEntities
      )
      expect(result.labware.a.contains).toBeUndefined()
      expect(result.labware.b.contains).toBeUndefined()
      expect(result.labware.c.contains).toBeUndefined()
    })
  })
})

describe('getStackedOnNodeFromPdStack flex stacker', () => {
  it('returns shuttle addressable area when stack uses the stacker module slot', () => {
    const moduleEntities = {
      stackerMod: {
        id: 'stackerMod',
        type: FLEX_STACKER_MODULE_TYPE,
        model: 'flexStackerModuleV1',
        pythonName: 'stacker_mod',
      },
    } as unknown as ModuleEntities
    const modules = {
      stackerMod: {
        slot: 'A3',
        moduleState: { type: FLEX_STACKER_MODULE_TYPE },
      },
    } as unknown as RobotState['modules']

    expect(
      getStackedOnNodeFromPdStack({
        stack: ['plateId', 'A3'],
        subjectLabwareId: 'plateId',
        moduleEntities,
        labwareEntityIds: new Set(['plateId']),
        modules,
      })
    ).toEqual({ addressableAreaName: FLEX_STACKER_A4_ADDRESSABLE_AREA })
  })

  it('returns shuttle AA when stack parent is staging A4 and a stacker occupies the cutout', () => {
    const moduleEntities = {
      stackerMod: {
        id: 'stackerMod',
        type: FLEX_STACKER_MODULE_TYPE,
        model: 'flexStackerModuleV1',
        pythonName: 'stacker_mod',
      },
    } as unknown as ModuleEntities
    const modules = {
      stackerMod: {
        slot: 'A3',
        moduleState: { type: FLEX_STACKER_MODULE_TYPE },
      },
    } as unknown as RobotState['modules']

    expect(
      getStackedOnNodeFromPdStack({
        stack: ['plateId', 'A4'],
        subjectLabwareId: 'plateId',
        moduleEntities,
        labwareEntityIds: new Set(['plateId']),
        modules,
      })
    ).toEqual({ addressableAreaName: FLEX_STACKER_A4_ADDRESSABLE_AREA })
  })
})
