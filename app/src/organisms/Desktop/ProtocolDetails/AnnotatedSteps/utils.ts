import type { RunTimeCommand } from '@opentrons/shared-data'

export const getIsVisibleProtocolStep = (command: RunTimeCommand): boolean => {
  return !command.commandType.includes('load') && command.commandType !== 'home'
}

export function getLastVisibleAnalysisCommandId(
  commands: RunTimeCommand[]
): string | null {
  for (let i = commands.length - 1; i >= 0; i--) {
    const command = commands[i]
    if (getIsVisibleProtocolStep(command)) {
      return command.id
    }
  }
  return null
}

export function getGroupedNodeIndexContainingCommandId(
  groupedNodes: ReadonlyArray<
    | {
        annotationId: string
        subCommands: ReadonlyArray<{ command: { id: string } }>
      }
    | { command: { id: string } }
  >,
  commandId: string
): number | null {
  for (let i = 0; i < groupedNodes.length; i++) {
    const node = groupedNodes[i]
    if ('annotationId' in node && 'subCommands' in node) {
      if (node.subCommands.some(sc => sc.command.id === commandId)) {
        return i
      }
    }
  }
  return null
}
