import isEqual from 'lodash/isEqual'
import last from 'lodash/last'
import mapValues from 'lodash/mapValues'

import {
  FLEX_CUTOUT_BY_SLOT_ID,
  FLEX_STACKER_MODULE_TYPE,
  getAddressableAreaNamesFromLoadedModule,
} from '@opentrons/shared-data'

import { HOPPER_STACKER_LOCATION } from '../constants'
import {
  getFlexStackerShuttleAddressableArea,
  resolveDeckSlotKeyForLabwareStackInSlot,
} from './misc'

import type {
  AddressableAreaName,
  DeckConfiguration,
  DeckDefinition,
  InStackerHopperLocation,
  LoadedLabwareLocation,
} from '@opentrons/shared-data'
import type {
  LabwareEntities,
  LabwareEntity,
  ModuleEntities,
  RobotState,
} from '../types'

type LabwareLocationCache = Map<LoadedLabwareLocation, LoadedLabwareLocation[]>

/**
 * Recursively computes the full stack of labware nodes from the given node upwards
 * (top-down), collecting each node until a non-labware node is reached.
 *
 * @param args.node The labware or location node to get the full stack for.
 * @param args.robotState The current robot state containing all labware.
 * @param args.stack (Optional) The stack collected so far, used in recursion.
 * @param args.memo (Optional) A memoization map to cache computed stacks for nodes.
 * @returns An object containing the complete stack and an updated memo map.
 */
export const getFullStackFromNodeTopDownRecursive = (args: {
  node: LoadedLabwareLocation
  robotState: RobotState
  stack?: LoadedLabwareLocation[]
  memo?: LabwareLocationCache
}): {
  stack: LoadedLabwareLocation[]
  memo: LabwareLocationCache
} => {
  const {
    node,
    stack = [],
    robotState,
    memo = new Map<LoadedLabwareLocation, LoadedLabwareLocation[]>(),
  } = args

  let newStack: LoadedLabwareLocation[] = stack
  if (!(typeof node === 'object' && 'labwareId' in node)) {
    newStack = [...stack, node]
    memo.set(node, newStack)
    return { stack: newStack, memo }
  }
  const { labwareId: parentLabwareId } = node
  const parentLabwareState = robotState.labware[parentLabwareId]
  if (parentLabwareState != null && parentLabwareState.stackedOnNode != null) {
    const { stack: parentStack, memo: updatedMemo } =
      getFullStackFromNodeTopDownRecursive({
        node: parentLabwareState.stackedOnNode,
        stack: [...stack, node],
        robotState,
        memo,
      })
    updateMemo(memo, updatedMemo)
    newStack = parentStack
    memo.set(node, newStack)
  }
  return { stack: newStack, memo }
}

/**
 * Finds the ID of the module associated with the provided node's stack, if any.
 *
 * @param args.node The labware/location node whose stack will be searched for a parent module.
 * @param args.robotState The current robot state including modules.
 * @param args.deckDef The deck definition, needed for cutout fixtures.
 * @param args.deckConfiguration The configuration of the deck, including cutout mappings.
 * @returns The string module id if found, or null otherwise.
 */
export const getNodeParentModuleId = (args: {
  node: LoadedLabwareLocation
  robotState: RobotState
  deckDef: DeckDefinition
  deckConfiguration: DeckConfiguration
}): string | null => {
  const { node, robotState, deckDef, deckConfiguration } = args
  const { stack } = getFullStackFromNodeTopDownRecursive({ node, robotState })
  const { cutoutFixtures } = deckDef

  // should be the last element of the stack, but we check every stack element to be safe
  const addressableAreaNode = stack.find(
    location =>
      typeof location === 'object' && 'addressableAreaName' in location
  )
  if (
    addressableAreaNode != null &&
    typeof addressableAreaNode === 'object' &&
    'addressableAreaName' in addressableAreaNode
  ) {
    const { addressableAreaName } = addressableAreaNode
    for (const { id: cfId, providesAddressableAreas } of cutoutFixtures) {
      const [possibleCutoutId] =
        Object.entries(providesAddressableAreas).find(([_, addressableAreas]) =>
          addressableAreas.includes(addressableAreaName)
        ) ?? []
      if (possibleCutoutId != null) {
        // grab cutout configuration in deck config
        // this cannot be null in practice (all cutouts should be configured in deck config)
        const cutoutConfig = deckConfiguration.find(
          ({ cutoutId }) => cutoutId === possibleCutoutId
        )!
        const { cutoutFixtureId, cutoutId } = cutoutConfig
        // check if the cutout fixture id and cutout id match, independent of possible module
        const isDeckConfigMatch =
          cutoutFixtureId === cfId && cutoutId === possibleCutoutId
        // check if module is configured in the matching cutout
        const matchingModule = Object.entries(robotState.modules).find(
          ([_, { slot }]) => FLEX_CUTOUT_BY_SLOT_ID[slot] === cutoutId
        )
        if (isDeckConfigMatch && matchingModule != null) {
          return matchingModule[0]
        }
      }
    }
  }
  return null
}

/**
 * Merges entries from updatedMemo into oldMemo.
 *
 * @param oldMemo The original LabwareLocationCache to update.
 * @param updatedMemo The LabwareLocationCache with new entries to copy in.
 */
const updateMemo = (
  oldMemo: LabwareLocationCache,
  updatedMemo: LabwareLocationCache
): void => {
  updatedMemo.forEach((value, key) => {
    oldMemo.set(key, value)
  })
}

/**
 * Checks if a node is present in a stack using deep equality.
 *
 * @param stack The stack of LoadedLabwareLocation objects.
 * @param node The node to check for presence in the stack.
 * @returns True if the node is found in the stack, false otherwise.
 */
const getIsNodeInStack = (
  stack: LoadedLabwareLocation[],
  node: LoadedLabwareLocation
): boolean => {
  return stack.some(location => isEqual(location, node))
}

/**
 * Finds the largest stack (with deepest nesting) that contains the specified labware.
 *
 * @param args.labwareId The id of the labware to search for within stacks.
 * @param args.robotState The current robot state to extract stacks from.
 * @returns The largest LoadedLabwareLocation[] stack that contains the target labware.
 */
export const getLargestStackContainingLabware = (args: {
  labwareId: string
  robotState: RobotState
}): LoadedLabwareLocation[] => {
  const { labwareId, robotState } = args
  const memo: LabwareLocationCache = new Map()
  const labwareNode: LoadedLabwareLocation = { labwareId }
  let longestStack: LoadedLabwareLocation[] = []

  // iterate over all labware and get the stack for each
  // memoize such that we don't recompute the stack if a node has been encountered and its stack computed
  for (const [id, { stackedOnNode }] of Object.entries(robotState.labware)) {
    const currentNode: LoadedLabwareLocation = { labwareId: id }
    // deprecate this null check once stackedOnNode is not optional
    if (stackedOnNode == null) {
      continue
    }

    let currentStack: LoadedLabwareLocation[]

    // stack has been calculated for this node, and we need not compute it
    const knownStack = memo.get(currentNode)
    if (knownStack != null) {
      currentStack = knownStack
    } else {
      const { stack: calculatedStack, memo: updatedMemo } =
        getFullStackFromNodeTopDownRecursive({
          node: currentNode,
          robotState,
          memo,
        })
      updateMemo(memo, updatedMemo)
      if (!getIsNodeInStack(calculatedStack, labwareNode)) {
        continue
      }
      memo.set(currentNode, calculatedStack)
      currentStack = calculatedStack
    }
    if (currentStack.length > longestStack.length) {
      longestStack = currentStack
    }
  }
  return longestStack
}

/**
 * Gets all unique, largest stacks of labware present in the current robot state.
 *
 * @param robotState The current robot state.
 * @returns An array of LoadedLabwareLocation[]—one for each largest stack (per root).
 */
export const getAllLargestStacks = (
  robotState: RobotState
): LoadedLabwareLocation[][] => {
  const largestStacks: LoadedLabwareLocation[][] = []

  // cache to avoid recomputing the largest stack a labware whose largest stack has already been computed
  const cache = new Set<string>()
  for (const labwareId of Object.keys(robotState.labware)) {
    if (cache.has(labwareId)) {
      continue
    }
    const largestStack = getLargestStackContainingLabware({
      labwareId,
      robotState,
    })
    largestStack.forEach(location => {
      if (typeof location === 'object' && 'labwareId' in location) {
        cache.add(location.labwareId)
      }
    })
    largestStacks.push(largestStack)
  }
  return largestStacks
}

export const getAddressableAreaFromModule = (args: {
  moduleId: string
  robotState: RobotState
  moduleEntities: ModuleEntities
  deckDef: DeckDefinition
}): AddressableAreaName | null => {
  const { moduleId, robotState, moduleEntities, deckDef } = args
  const moduleState = robotState.modules[moduleId]
  const moduleEntity = moduleEntities[moduleId]
  if (moduleState == null || moduleEntity == null) {
    return null
  }
  const { slot } = moduleState
  const { model } = moduleEntity

  const possibleAddressableAreas = getAddressableAreaNamesFromLoadedModule(
    model,
    slot,
    deckDef
  )
  if (possibleAddressableAreas.length === 0) {
    return null
  }
  // based on the stack retrieval logic, if the base of a stack is a module, the only relevant addressable area will be the first possible addressable area
  return possibleAddressableAreas[0]
}

/**
 * Gets the addressable area name for a given labware location.
 *
 * @param args.location The labware location to get the addressable area name for.
 * @param args.robotState The current robot state.
 * @param args.moduleEntities The module entities.
 * @param args.deckDef The deck definition.
 * @returns The addressable area name, or null if no addressable area name is found.
 */
export const getAddressableAreaNameFromLabwareLocation = (args: {
  location: LoadedLabwareLocation
  robotState: RobotState
  moduleEntities: ModuleEntities
  deckDef: DeckDefinition
}): AddressableAreaName | null => {
  const { location, robotState, moduleEntities, deckDef } = args
  if (
    location === 'offDeck' ||
    location === 'systemLocation' ||
    location === 'wasteChuteLocation'
  ) {
    return null
  }
  if ('slotName' in location) {
    // each slot has a valid addressable area name, so this should be safe
    return location.slotName as AddressableAreaName
  }
  if ('addressableAreaName' in location) {
    return location.addressableAreaName
  }
  if ('moduleId' in location) {
    const { moduleId } = location
    return getAddressableAreaFromModule({
      moduleId,
      robotState,
      moduleEntities,
      deckDef,
    })
  }
  return null
}

/**
 * Gets all provided addressable areas in the deck configuration.
 * The returned addressable areas should be the uppermost provided areas.
 * For example, if a magnetic block is configured in slot C1, addressable
 * area C1 should not be returned, but rather magneticBlockV1C1 should be.
 *
 * @param args.deckConfiguration The deck configuration.
 * @param args.deckDefinition The deck definition.
 * @returns An array of AddressableAreaName.
 */
export const getAllProvidedAddressableAreasFromDeckConfig = (args: {
  deckConfiguration: DeckConfiguration
  deckDefinition: DeckDefinition
}): Set<AddressableAreaName> => {
  const { deckConfiguration, deckDefinition } = args
  return deckConfiguration.reduce<Set<AddressableAreaName>>(
    (
      acc,
      {
        cutoutFixtureId: deckConfigCutoutFixtureId,
        cutoutId: deckConfigCutoutId,
      }
    ) => {
      const providedAddressableAreas =
        deckDefinition.cutoutFixtures.find(
          ({ id: deckDefCutoutFixtureId }) =>
            deckConfigCutoutFixtureId === deckDefCutoutFixtureId
        )?.providesAddressableAreas[deckConfigCutoutId] ?? []
      providedAddressableAreas.forEach(area => {
        acc.add(area)
      })
      return acc
    },
    new Set<AddressableAreaName>()
  )
}

export const getProvidedAddressableAreasExposed = (args: {
  robotState: RobotState
  deckConfiguration: DeckConfiguration
  deckDefinition: DeckDefinition
  moduleEntities: ModuleEntities
}): Set<AddressableAreaName> => {
  const { robotState, deckConfiguration, deckDefinition, moduleEntities } = args
  const allProvidedAddressableAreas =
    getAllProvidedAddressableAreasFromDeckConfig({
      deckConfiguration,
      deckDefinition,
    })
  const exposedAddressableAreas = new Set<AddressableAreaName>(
    allProvidedAddressableAreas
  )
  const labwareStacks = getAllLargestStacks(robotState)
  for (const stack of labwareStacks) {
    const bottomNode = last(stack)
    if (typeof bottomNode === 'object' && 'addressableAreaName' in bottomNode) {
      const { addressableAreaName } = bottomNode
      exposedAddressableAreas.delete(addressableAreaName)
    }
    if (typeof bottomNode === 'object' && 'slotName' in bottomNode) {
      // if a slot is the bottom node of a stack, it can safely be inferred as an addressable area
      const { slotName } = bottomNode
      exposedAddressableAreas.delete(slotName as AddressableAreaName)
    }
    if (typeof bottomNode === 'object' && 'moduleId' in bottomNode) {
      const { moduleId } = bottomNode
      const addressableAreaName = getAddressableAreaFromModule({
        moduleId,
        robotState,
        moduleEntities,
        deckDef: deckDefinition,
      })
      if (addressableAreaName != null) {
        exposedAddressableAreas.delete(addressableAreaName)
      }
    }
  }
  return exposedAddressableAreas
}

const shouldUseAddressableAreaNameForStackParent = (s: string): boolean => {
  const sTransformed = s.toLowerCase()
  return (
    sTransformed.includes('chute') ||
    sTransformed.includes('waste') ||
    sTransformed.startsWith('gripper') ||
    sTransformed === '96channelwastechute'
  )
}

/**
 * Protocol Designer stack strings (top → bottom) map to PE `LoadedLabwareLocation`
 * for the immediate parent of `subjectLabwareId`.
 */
export const getStackedOnNodeFromPdStack = (args: {
  stack: string[]
  subjectLabwareId: string
  moduleEntities: ModuleEntities
  labwareEntityIds: ReadonlySet<string>
  modules: RobotState['modules']
}): LoadedLabwareLocation | undefined => {
  const { stack, subjectLabwareId, moduleEntities, labwareEntityIds, modules } =
    args

  if (stack.length === 0 || stack[0] !== subjectLabwareId || stack.length < 2) {
    return undefined
  }

  const parent = stack[1]

  if (parent === HOPPER_STACKER_LOCATION) {
    const moduleId = stack[2]
    if (moduleId == null) {
      return undefined
    }
    return { kind: 'inStackerHopper', moduleId }
  }

  if (moduleEntities[parent] != null) {
    return { moduleId: parent }
  }

  if (labwareEntityIds.has(parent)) {
    return { labwareId: parent }
  }

  if (parent === 'offDeck') {
    return 'offDeck'
  }

  if (parent === 'systemLocation') {
    return 'systemLocation'
  }

  if (parent === 'wasteChuteLocation') {
    return 'wasteChuteLocation'
  }

  if (shouldUseAddressableAreaNameForStackParent(parent)) {
    return { addressableAreaName: parent as AddressableAreaName }
  }

  const deckSlotForShuttleAa =
    resolveDeckSlotKeyForLabwareStackInSlot(parent, modules, moduleEntities) ??
    parent
  const hasFlexStackerAtDeckSlot = Object.entries(modules).some(
    ([moduleId, mod]) =>
      moduleEntities[moduleId]?.type === FLEX_STACKER_MODULE_TYPE &&
      mod.slot === deckSlotForShuttleAa
  )
  if (hasFlexStackerAtDeckSlot) {
    const shuttleAa = getFlexStackerShuttleAddressableArea(deckSlotForShuttleAa)
    if (shuttleAa != null) {
      return { addressableAreaName: shuttleAa }
    }
  }

  return { slotName: parent }
}

const getIsInStackerHopperLocation = (
  node: LoadedLabwareLocation
): node is InStackerHopperLocation =>
  typeof node === 'object' &&
  node !== null &&
  'kind' in node &&
  node.kind === 'inStackerHopper'

/**
 * Slot / module / on-labware / addressable-area parents qualify for sibling containment;
 * string locations and hopper do not.
 */
const getIsEligibleSharedStackParent = (
  stackedOnNode: LoadedLabwareLocation
): boolean => {
  if (typeof stackedOnNode !== 'object' || stackedOnNode === null) {
    return false
  }
  return !getIsInStackerHopperLocation(stackedOnNode)
}

/** When one footprint is strictly larger in both X and Y, returns container vs contained ids. */
interface ContainedLabwareRelationship {
  containerLabwareId: string
  containedLabwareId: string
}

const getPotentiallyContainedLabwareRelationship = (
  entityA: LabwareEntity,
  entityB: LabwareEntity
): ContainedLabwareRelationship | null => {
  const { id: idA, def: defA } = entityA
  const { id: idB, def: defB } = entityB
  const ax = defA.dimensions.xDimension
  const ay = defA.dimensions.yDimension
  const bx = defB.dimensions.xDimension
  const by = defB.dimensions.yDimension
  if (ax > bx && ay > by) {
    return { containerLabwareId: idA, containedLabwareId: idB }
  }
  if (bx > ax && by > ay) {
    return { containerLabwareId: idB, containedLabwareId: idA }
  }
  return null
}

/**
 * When exactly two labware share the same object `stackedOnNode` (non-hopper), and one labware
 * footprint strictly exceeds the other in both X and Y, set `contains` on the **larger** labware
 * to the id of the smaller-footprint labware. Groups of size other than 2, ties, or missing defs are skipped.
 */
export const assignContainsAmongSiblings = (
  labware: RobotState['labware'],
  labwareEntities: LabwareEntities
): RobotState['labware'] => {
  // mapping of (key: stringified parent node) to (value: array of labware IDs stacked on that node)
  const groups = new Map<string, string[]>()
  for (const labwareId of Object.keys(labware)) {
    const stackedOnNode = labware[labwareId].stackedOnNode
    if (
      stackedOnNode == null ||
      !getIsEligibleSharedStackParent(stackedOnNode)
    ) {
      continue
    }
    // hash the stackedOnNode to group labware by the same parent
    const key = JSON.stringify(stackedOnNode)
    const bucket = groups.get(key) ?? []
    bucket.push(labwareId)
    groups.set(key, bucket)
  }

  const containsByContainerId: Record<string, string> = {}
  for (const ids of groups.values()) {
    if (ids.length !== 2) {
      continue
    }
    const [idA, idB] = ids
    const entityA = labwareEntities[idA]
    const entityB = labwareEntities[idB]
    if (entityA == null || entityB == null) {
      continue
    }
    const relationship = getPotentiallyContainedLabwareRelationship(
      entityA,
      entityB
    )
    if (relationship == null) {
      continue
    }
    const { containerLabwareId, containedLabwareId } = relationship

    containsByContainerId[containerLabwareId] = containedLabwareId
  }

  if (Object.keys(containsByContainerId).length === 0) {
    return labware
  }
  return mapValues(labware, (lw, id) =>
    containsByContainerId[id] != null
      ? { ...lw, contains: containsByContainerId[id] }
      : lw
  )
}

/**
 * Ensures each labware row has `stackedOnNode` for stack-graph traversals.
 * Fills from Protocol Designer-style `stack` via {@link getStackedOnNodeFromPdStack} when missing.
 *
 * When `labwareEntities` is passed, pairs of labware that share the same eligible parent
 * `stackedOnNode` may set `contains` on the larger footprint to the smaller labware id.
 *
 * **Protocol Designer:** call once when composing initial robot state (see PD
 * {@link getInitialEnrichedRobotState}). After that, timeline `robotState` frames should keep this metadata
 * current via command-specific updaters (`forMoveLabware`, stacker handlers, etc.), not by
 * re-running this helper on every active step.
 */
export const enrichRobotStateForStackGraphTraversals = (
  robotState: RobotState,
  moduleEntities: ModuleEntities,
  labwareEntities: LabwareEntities
): RobotState => {
  const labwareIds = Object.keys(robotState.labware)
  const labwareEntityIds = new Set(labwareIds)
  let labware = mapValues(robotState.labware, (lw, id) => {
    const stackedOnNode =
      lw.stackedOnNode ??
      getStackedOnNodeFromPdStack({
        stack: lw.stack,
        subjectLabwareId: id,
        moduleEntities,
        labwareEntityIds,
        modules: robotState.modules,
      })
    return stackedOnNode != null ? { ...lw, stackedOnNode } : { ...lw }
  })
  // assign contains among siblings
  labware = assignContainsAmongSiblings(labware, labwareEntities)

  return {
    ...robotState,
    labware,
  }
}
