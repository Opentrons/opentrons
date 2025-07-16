import type { LabwareInStack, StackItem } from '../types'

export function getTopLabwareFromStack(
  itemsOnDeck: StackItem[]
): LabwareInStack | null {
  const topLabwareInStack = itemsOnDeck.find(
    (stackedItem): stackedItem is LabwareInStack => 'labwareId' in stackedItem
  )
  return topLabwareInStack ?? null
}
