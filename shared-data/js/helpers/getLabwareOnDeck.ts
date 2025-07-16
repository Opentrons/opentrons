import type { LabwareInStack, StackedItemsOnDeck } from '../types'

// filter function to get stacks with no modules and on deck
export function getLabwareOnDeck(
  itemsOnDeck: StackedItemsOnDeck
): {
  [slotName: string]: LabwareInStack[]
} {
  // @ts-expect-error this filter should act as a type narrower
  const labwareOnDeckEntries: Array<
    [string, LabwareInStack[]]
  > = Object.entries(itemsOnDeck).filter(
    ([key, value]) =>
      key !== 'offDeck' &&
      value.every(
        (stackItem): stackItem is LabwareInStack => 'labwareId' in stackItem
      )
  )
  return Object.fromEntries(labwareOnDeckEntries)
}
