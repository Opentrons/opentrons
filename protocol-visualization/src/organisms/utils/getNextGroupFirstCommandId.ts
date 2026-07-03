import type { GroupedCommands } from '../../types'

export function getNextGroupFirstCommandId(
  groupedCommands: GroupedCommands | null,
  currentCommandId: string
): string | null {
  if (groupedCommands == null) {
    return null
  }

  const currentIndex = groupedCommands.findIndex(group => {
    if ('subCommands' in group) {
      return group.subCommands.some(
        leaf => leaf.command.id === currentCommandId
      )
    } else {
      return group.command.id === currentCommandId
    }
  })

  if (currentIndex === -1 || currentIndex + 1 >= groupedCommands.length) {
    return null // No next group
  }

  const nextGroup = groupedCommands[currentIndex + 1]

  if ('subCommands' in nextGroup) {
    return nextGroup.subCommands[0]?.command.id ?? null
  } else {
    return nextGroup.command.id
  }
}
