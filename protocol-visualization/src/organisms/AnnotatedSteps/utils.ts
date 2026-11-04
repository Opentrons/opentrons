import type { RunTimeCommand } from '@opentrons/shared-data'

// space for StepGroup header (title row, optional subtitle, padding)
export const STEP_GROUP_HEADER_RESERVE_PX = 80
export const MIN_EXPANDED_BODY_PX = 160
export const LIST_VIEWPORT_BOTTOM_BUFFER_PX = 8
// matches AnnotatedSteps DEFAULT_ROW_HEIGHT_PX.
export const ESTIMATED_COMMAND_HEIGHT_PX = 64
export const TRAILING_ERRORS_FOOTER_ESTIMATE_PX = 100

export function getExpandedGroupBodyMaxHeightPx(
  listViewportHeight: number
): number | null {
  if (listViewportHeight <= 0) {
    return null
  }

  return Math.max(
    MIN_EXPANDED_BODY_PX,
    listViewportHeight -
      STEP_GROUP_HEADER_RESERVE_PX -
      LIST_VIEWPORT_BOTTOM_BUFFER_PX
  )
}

export function getEstimatedExpandedGroupContentHeightPx(params: {
  subCommandCount: number
  hasTrailingErrors?: boolean
}): number {
  const { subCommandCount, hasTrailingErrors = false } = params

  return (
    subCommandCount * ESTIMATED_COMMAND_HEIGHT_PX +
    (hasTrailingErrors ? TRAILING_ERRORS_FOOTER_ESTIMATE_PX : 0)
  )
}

// only cap expanded stepGroup height when content would exceed the list viewport
export function shouldCapExpandedGroupBodyHeight(params: {
  subCommandCount: number
  listViewportHeight: number
  hasTrailingErrors?: boolean
}): boolean {
  const bodyMaxHeightPx = getExpandedGroupBodyMaxHeightPx(
    params.listViewportHeight
  )

  if (bodyMaxHeightPx == null) {
    return false
  }

  return getEstimatedExpandedGroupContentHeightPx(params) > bodyMaxHeightPx
}

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
