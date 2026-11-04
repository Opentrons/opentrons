import type { GroupedCommands } from '../../types'

export function getPreviousGroupFirstCommandId(
  groupedCommands: GroupedCommands | null,
  currentCommandId: string
): string | null {
  if (!groupedCommands) {
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

  if (currentIndex <= 0) {
    return null
  }

  const previousGroup = groupedCommands[currentIndex - 1]

  if ('subCommands' in previousGroup) {
    return previousGroup.subCommands[0]?.command.id ?? null
  } else {
    return previousGroup.command.id
  }
}
