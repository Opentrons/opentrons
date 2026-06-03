import sum from 'lodash/sum'

import { getHeightOfLabwareStackFromDefinitions } from './getFlexStackerHardwareProps'

import type { LabwareDefinition, LabwareDefinitionsByURI } from '../types'
import type { LabwareInStack, StackItem } from './getStackedItemsOnStartingDeck'

/**
 * Merges multiple diverging stacks that share a common parent into a
 * single top-to-bottom StackItem[] ordered by each items' absolute
 * height relative to the shared parent.
 *
 * Higher in physical space is mapped to earlier placement in the output array.
 *
 * @param stacks - Each inner array is a single top-to-bottom stack whose last
 *   element is the shared parent (module or labware).
 * @param labwareDefinitions - URI → LabwareDefinition lookup from the protocol.
 * @returns A single StackItem[] ordered top-to-bottom by chain depth then height.
 */
export function getMergedDivergingStacks2(
  stacks: StackItem[][],
  labwareDefinitions: LabwareDefinitionsByURI
): StackItem[] {
  if (stacks.length === 0) {
    return []
  }

  const sharedParent = stacks[0][stacks[0].length - 1] ?? null

  // Map labwareId to { item, depth, height } keeping the maximum observed depth
  // (and height as tiebreaker at the same depth).
  const itemMap = new Map<
    string,
    { item: LabwareInStack; depth: number; height: number }
  >()

  for (const stack of stacks) {
    // reverse to process bottom-to-top, excluding the shared parent
    const bottomToTop = stack
      .slice(0, stack.length - 1)
      .filter((item): item is LabwareInStack => 'labwareId' in item)
      .reverse()

    for (let i = 0; i < bottomToTop.length; i++) {
      // 0-indexed, where 0 = directly on parent, 1 = one level above, etc.
      const depth = i

      const defs = bottomToTop
        .slice(0, i + 1)
        .reduce<LabwareDefinition[]>((acc, item) => {
          const def = labwareDefinitions[item.definitionUri]
          return def != null ? [...acc, def] : acc
        }, [])

      const topSurface =
        defs.length > 0 ? getHeightOfLabwareStackFromDefinitions(defs) : 0

      const current = itemMap.get(bottomToTop[i].labwareId)
      if (
        current == null ||
        depth > current.depth ||
        (depth === current.depth && topSurface > current.height)
      ) {
        itemMap.set(bottomToTop[i].labwareId, {
          item: bottomToTop[i],
          depth,
          height: topSurface,
        })
      }
    }
  }

  // Deeper items first; break ties by height (taller = earlier in array).
  const sorted = Array.from(itemMap.values()).sort((a, b) =>
    b.depth !== a.depth ? b.depth - a.depth : b.height - a.height
  )

  const result: StackItem[] = sorted.map(({ item }) => item)
  if (sharedParent != null) {
    result.push(sharedParent)
  }
  return result
}

export function getMergedDivergingStacks(
  stacks: StackItem[][],
  labwareDefinitions: LabwareDefinitionsByURI
): StackItem[] {
  if (stacks.length === 0) {
    return []
  }
  if (stacks.length === 1) {
    return stacks[0]
  }
  // Start at 1 to skip the shared parent (always the last element of each stack)
  const pointers: number[] = stacks.map(() => 1)
  // Track accumulated defs per stack for correct cumulative height computation
  const prevLabwareDefs: LabwareDefinition[][] = stacks.map(() => [])
  const sharedParentCheck = stacks[0][stacks[0].length - 1] ?? null

  const getItemId = (item: StackItem): string | null =>
    'labwareId' in item
      ? item.labwareId
      : 'moduleId' in item
        ? item.moduleId
        : null
  const sharedParentId =
    sharedParentCheck != null ? getItemId(sharedParentCheck) : null

  // check that each shared parent is the same
  for (const stack of stacks) {
    if (getItemId(stack[stack.length - 1]) !== sharedParentId) {
      console.warn('Each stack must have the same shared parent')
      return []
    }
  }

  const safetyMaxIterations = sum(stacks.map(stack => stack.length))
  let safetyIteration: number = 0
  const running: StackItem[] = []
  const outputIds = new Set<string>()

  // haven't exhausted all stacks, so continue
  while (
    pointers.some((pointer, i) => pointer < stacks[i].length) &&
    safetyIteration <= safetyMaxIterations
  ) {
    let lowestHeight: number | null = null
    let lowestStackIndex: number | null = null
    for (let stackIndex = 0; stackIndex < stacks.length; stackIndex++) {
      const stack = stacks[stackIndex]
      const pointer = pointers[stackIndex]
      const transformedPointer = stack.length - 1 - pointer
      safetyIteration++

      // exhausted this stack, so continue
      if (transformedPointer < 0) {
        continue
      }

      // current element in the stack is not a labware, so push pointer and continue
      const currentItem = stack[transformedPointer]
      if (!('labwareId' in currentItem)) {
        pointers[stackIndex]++
        continue
      }
      const currentDef = labwareDefinitions[currentItem.definitionUri]
      const accDefs = [...prevLabwareDefs[stackIndex], currentDef]
      const newHeight =
        accDefs.length > 0 ? getHeightOfLabwareStackFromDefinitions(accDefs) : 0
      if (
        lowestStackIndex == null ||
        lowestHeight == null ||
        newHeight < lowestHeight
      ) {
        lowestHeight = newHeight
        lowestStackIndex = stackIndex
      }
    }

    // after iterating through all stacks, choose the stack to build the running flat stack
    if (lowestStackIndex != null) {
      const chosenStack = stacks[lowestStackIndex]
      const currentTransformedPointer =
        chosenStack.length - 1 - pointers[lowestStackIndex]
      const stackItemToPush = chosenStack[currentTransformedPointer]
      const itemId =
        'labwareId' in stackItemToPush ? stackItemToPush.labwareId : null
      // deduplicate: same labware may appear in multiple stacks
      if (itemId == null || !outputIds.has(itemId)) {
        running.push(stackItemToPush)
        if (itemId != null) outputIds.add(itemId)
      }
      const newDef =
        'definitionUri' in stackItemToPush
          ? labwareDefinitions[stackItemToPush.definitionUri]
          : null
      if (newDef != null) {
        prevLabwareDefs[lowestStackIndex] = [
          ...prevLabwareDefs[lowestStackIndex],
          newDef,
        ]
      }
      pointers[lowestStackIndex]++
    }
  }
  // running is built bottom-to-top; reverse to get top-to-bottom order
  running.reverse()
  if (sharedParentCheck != null) {
    running.push(sharedParentCheck)
  }
  return running
}
