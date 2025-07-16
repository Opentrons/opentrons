import type { ModuleInStack, StackItem } from '../types'

export function getModuleFromStack(
  itemsOnDeck: StackItem[]
): ModuleInStack | null {
  const moduleInStack = itemsOnDeck.find(
    (stackedItem): stackedItem is ModuleInStack => 'moduleId' in stackedItem
  )
  return moduleInStack ?? null
}
