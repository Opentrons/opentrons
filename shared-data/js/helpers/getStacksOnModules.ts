import type { ModuleInStack, StackedItemsOnDeck, StackItem } from '../types'

// filter function to get stacks that include modules
export function getStacksOnModules(
  itemsOnDeck: StackedItemsOnDeck
): {
  [slotName: string]: {
    // This could be typed more cleverly as:
    // [ModuleInStack, ...StackItem[]]
    // if we're sure that the module is always the first element in the array,
    // but I'm not sure if that's actually the case.
    allItemsInStack: StackItem[]
    moduleInStack: ModuleInStack
  }
} {
  return Object.entries(itemsOnDeck).reduce((acc, entry) => {
    const [slotName, stack] = entry
    const moduleInStack = stack.find(
      (stackItem): stackItem is ModuleInStack => 'moduleId' in stackItem
    )
    return moduleInStack != null
      ? {
          ...acc,
          [slotName]: {
            allItemsInStack: stack,
            moduleInStack,
          },
        }
      : acc
  }, {})
}
