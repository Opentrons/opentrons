import type { LabwareInStack, StackedItemsOnDeck, StackItem } from '../types'

// filter function to get stacks that include labware
export function getStacksWithLabware(
  itemsOnDeck: StackedItemsOnDeck
): { [slotName: string]: StackItem[] } {
  const stacksWithLabwareEntries = Object.entries(
    itemsOnDeck
  ).filter(([key, value]) =>
    value.some(
      (stackItem): stackItem is LabwareInStack => 'labwareId' in stackItem
    )
  )
  return Object.fromEntries(stacksWithLabwareEntries)
}
